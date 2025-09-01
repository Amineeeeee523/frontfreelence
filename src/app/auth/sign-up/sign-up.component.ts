import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';


import { AuthService } from '../../services/auth.service';
import { RegisterRequestDto } from '../../models/register-request.model';
import { TypeUtilisateur, Disponibilite, NiveauExperience, Langue, TypeClient } from '../../models/utilisateur.model';
import { MissionCategorie, Gouvernorat } from '../../models/mission.model';
import { FileStorageService } from '../../services/file-storage.service';
import { CompetenceService } from '../../services/competence.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
  animations: [
    trigger('slideInOut', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in')
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class SignUpComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fileStorageService = inject(FileStorageService);
  private competenceService = inject(CompetenceService);

  signUpForm!: FormGroup;
  currentStep = 0;
  errorMessage: string | null = null;
  profileImagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isUploading = false;
  availableCompetences: string[] = [];
  isLoadingCompetences = false;

  // Enums pour le template
  TypeUtilisateur = TypeUtilisateur;
  Disponibilite = Disponibilite;
  NiveauExperience = NiveauExperience;
  Langue = Langue;
  TypeClient = TypeClient;
  MissionCategorie = MissionCategorie;
  Gouvernorat = Gouvernorat;
  missionCategories = Object.values(MissionCategorie);
  gouvernorats = Object.values(Gouvernorat);


  constructor() {}

  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      // Étape 0: Choix du type
      typeUtilisateur: [TypeUtilisateur.FREELANCE, Validators.required],
      typeClient: [TypeClient.PME_STARTUP], // Valeur par défaut, pas de validateur ici
      
      // Étape 1: Infos personnelles
      infosPersonnelles: this.fb.group({
        prenom: ['', Validators.required],
        nom: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        numeroTelephone: ['', Validators.pattern('^\\d{8}$')], // TN: 8 chiffres
        languePref: [Langue.FR, Validators.required],
        localisation: ['', Validators.required],
        gouvernorat: ['', Validators.required],
        photoProfilUrl: [''],
        linkedinUrl: ['', Validators.pattern('https?://.+')],
        githubUrl: ['', Validators.pattern('https?://.+')]
      }, { validators: this.passwordMatchValidator }),

      // Étape 2: Détails spécifiques
      detailsFreelance: this.fb.group({
        titreProfil: ['', Validators.required],
        competences: this.fb.array([], [this.minArrayLength(1)]),
        tarifHoraire: ['', [Validators.required, Validators.min(0.01)]],
        tarifJournalier: ['', [Validators.required, Validators.min(0.01)]],
        niveauExperience: [NiveauExperience.DEBUTANT, Validators.required],
        disponibilite: [Disponibilite.INDISPONIBLE, Validators.required],
        categories: this.fb.array([], [this.minArrayLength(1)]),
        bio: [''],
        portfolioUrls: this.fb.array([]),
        pushTokens: this.fb.array([])
      }),
      detailsClient: this.fb.group({
        nomEntreprise: [''],
        siteEntreprise: ['', Validators.pattern('https?://.+')],
        descriptionEntreprise: ['', Validators.maxLength(1000)],
        localisation: ['', Validators.required],
        pushTokens: this.fb.array([])
      })
    });

    this.onTypeUtilisateurChange();
    this.onTypeClientChange();
    // Appliquer immédiatement le mode initial (par défaut: FREELANCE)
    const initialType = this.signUpForm.get('typeUtilisateur')?.value;
    this.applyTypeMode(initialType);

    // Charger les compétences dynamiquement quand les catégories changent (Freelance)
    const freelanceCategories = this.getArray('detailsFreelance', 'categories');
    freelanceCategories.valueChanges.subscribe(() => {
      this.loadCompetencesBySelectedCategories();
    });
  }

  onTypeUtilisateurChange(): void {
    this.signUpForm.get('typeUtilisateur')?.valueChanges.subscribe(val => {
      this.applyTypeMode(val);
    });
  }

  private applyTypeMode(val: TypeUtilisateur): void {
    if (val === TypeUtilisateur.FREELANCE) {
      // Activer Freelance, désactiver Client
      (this.getGroup('detailsFreelance') as FormGroup).enable({ emitEvent: false });
      (this.getGroup('detailsClient') as FormGroup).disable({ emitEvent: false });

      this.addFreelanceValidators();
      this.clearClientValidators();
      this.getControl('typeClient')?.clearValidators();
      // Charger compétences si des catégories sont déjà sélectionnées
      this.loadCompetencesBySelectedCategories();
    } else {
      // Activer Client, désactiver Freelance
      (this.getGroup('detailsClient') as FormGroup).enable({ emitEvent: false });
      (this.getGroup('detailsFreelance') as FormGroup).disable({ emitEvent: false });

      this.addClientValidators();
      this.clearFreelanceValidators();
      this.getControl('typeClient')?.setValidators(Validators.required);
      // Nettoyer compétences disponibles quand on n'est pas freelance
      this.availableCompetences = [];
    }
    this.getControl('typeClient')?.updateValueAndValidity({ emitEvent: false });
  }

  onTypeClientChange(): void {
    this.getControl('typeClient')?.valueChanges.subscribe((type: TypeClient) => {
      const nomEntreprise = this.getGroup('detailsClient').get('nomEntreprise');
      const siteEntreprise = this.getGroup('detailsClient').get('siteEntreprise');

      if (type === TypeClient.ENTREPRENEUR || type === TypeClient.ETUDIANT_PARTICULIER) {
        nomEntreprise?.clearValidators();
        siteEntreprise?.clearValidators();
      } else {
        nomEntreprise?.setValidators(Validators.required);
        // siteEntreprise est optionnel, mais on pourrait vouloir ajouter un validateur de pattern ici
        siteEntreprise?.setValidators(Validators.pattern('https?://.+'));
      }
      nomEntreprise?.updateValueAndValidity();
      siteEntreprise?.updateValueAndValidity();
    });
  }

  addFreelanceValidators() {
    this.getGroup('detailsFreelance').get('tarifHoraire')?.setValidators([Validators.required, Validators.min(0.01)]);
    this.getGroup('detailsFreelance').get('tarifJournalier')?.setValidators([Validators.required, Validators.min(0.01)]);
    this.getGroup('detailsFreelance').get('niveauExperience')?.setValidators(Validators.required);
    this.getGroup('detailsFreelance').get('disponibilite')?.setValidators(Validators.required);
    this.getGroup('detailsFreelance').updateValueAndValidity();
  }
  
  clearFreelanceValidators() {
    this.getGroup('detailsFreelance').get('tarifHoraire')?.clearValidators();
    this.getGroup('detailsFreelance').get('tarifJournalier')?.clearValidators();
    this.getGroup('detailsFreelance').get('niveauExperience')?.clearValidators();
    this.getGroup('detailsFreelance').get('disponibilite')?.clearValidators();
    this.getGroup('detailsFreelance').updateValueAndValidity();
  }

  // Appel backend: compétences par catégories sélectionnées
  private loadCompetencesBySelectedCategories(): void {
    const isFreelance = this.signUpForm.get('typeUtilisateur')?.value === TypeUtilisateur.FREELANCE;
    if (!isFreelance) { this.availableCompetences = []; return; }
    const selectedCategories: MissionCategorie[] = (this.getArray('detailsFreelance', 'categories').value || []) as MissionCategorie[];
    if (!selectedCategories || selectedCategories.length === 0) { this.availableCompetences = []; return; }
    this.isLoadingCompetences = true;
    this.competenceService.getByCategories(selectedCategories).subscribe({
      next: (skills: string[]) => {
        this.availableCompetences = skills || [];
        this.isLoadingCompetences = false;
      },
      error: () => {
        this.availableCompetences = [];
        this.isLoadingCompetences = false;
      }
    });
  }

  addClientValidators() {
    this.getGroup('detailsClient').get('nomEntreprise')?.setValidators(Validators.required);
    this.getGroup('detailsClient').get('localisation')?.setValidators(Validators.required);
    this.getGroup('detailsClient').updateValueAndValidity();
  }

  clearClientValidators() {
    const dc = this.getGroup('detailsClient');
    dc.get('nomEntreprise')?.clearValidators();
    dc.get('siteEntreprise')?.clearValidators();
    dc.get('descriptionEntreprise')?.clearValidators();
    dc.get('localisation')?.clearValidators();
    dc.updateValueAndValidity({ emitEvent: false });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Validator: require at least N items in a FormArray
  private minArrayLength(min: number): ValidatorFn {
    return (control: AbstractControl) => {
      if (!(control instanceof FormArray)) return null;
      return control.length >= min ? null : { minArrayLength: { required: min, actual: control.length } };
    };
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // --- Gestion des étapes ---
  nextStep(): void {
    // Forcer la validation hors template juste avant le test
    if (this.currentStep === 3) {
      const type = this.signUpForm.get('typeUtilisateur')?.value;
      if (type === TypeUtilisateur.FREELANCE) {
        const df = this.getGroup('detailsFreelance');
        (df.get('competences') as FormArray)?.updateValueAndValidity({ emitEvent: false });
        (df.get('categories') as FormArray)?.updateValueAndValidity({ emitEvent: false });
      } else {
        this.getGroup('detailsClient')?.updateValueAndValidity({ emitEvent: false });
      }
    }

    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    } else {
      this.signUpForm.markAllAsTouched();
    }
    // déclencher la validation du type de client lorsque l'utilisateur est un client
    if (this.signUpForm.get('typeUtilisateur')?.value === TypeUtilisateur.CLIENT) {
      this.onTypeClientChange();
    }
  }

  prevStep(): void {
    this.currentStep--;
  }

  isStepValid(step: number): boolean {
    switch(step) {
      case 0:
        const typeUser = this.signUpForm.get('typeUtilisateur');
        const typeClient = this.getControl('typeClient');
        if (typeUser?.value === TypeUtilisateur.CLIENT) {
          return (typeUser.valid ?? false) && (typeClient.valid ?? false);
        }
        return typeUser?.valid ?? false;
      case 1: 
        // Validation pour les informations de base (nom, email, mot de passe)
        const infos = this.getGroup('infosPersonnelles');
        return (infos.get('prenom')?.valid ?? false) && 
               (infos.get('nom')?.valid ?? false) && 
               (infos.get('email')?.valid ?? false) && 
               (infos.get('password')?.valid ?? false) && 
               (infos.get('confirmPassword')?.valid ?? false) &&
               !(infos.errors?.['passwordMismatch'] ?? false);
      case 2: 
        // Validation pour le profil et localisation
        const profil = this.getGroup('infosPersonnelles');
        return (profil.get('localisation')?.valid ?? false) && 
               (profil.get('gouvernorat')?.valid ?? false) && 
               (profil.get('languePref')?.valid ?? false);
      case 3:
        const type = this.signUpForm.get('typeUtilisateur')?.value;
        if (type === TypeUtilisateur.FREELANCE) {
          // Ne pas faire de mutation ici (pas d'updateValueAndValidity)
          const df = this.getGroup('detailsFreelance');
          return df.valid ?? false;
        }
        return this.getGroup('detailsClient').valid ?? false;
      default: return true;
    }
  }

  // --- Helpers pour le template ---
  getGroup(name: string): FormGroup {
    return this.signUpForm.get(name) as FormGroup;
  }

  get infosPersonnellesGroup() { return this.getGroup('infosPersonnelles'); }
  get detailsFreelanceGroup() { return this.getGroup('detailsFreelance'); }
  get detailsClientGroup() { return this.getGroup('detailsClient'); }

  getControl(name: string): FormControl {
    return this.signUpForm.get(name) as FormControl;
  }

  getArray(groupName: string, arrayName: string): FormArray {
    return (this.signUpForm.get(groupName) as FormGroup).get(arrayName) as FormArray;
  }

  // --- Gestion des FormArrays (compétences, portfolio, etc.) ---
  addControl(groupName: string, arrayName: string, event: any): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      this.getArray(groupName, arrayName).push(new FormControl(value, Validators.required));
      input.value = '';
    }
  }

  removeControl(groupName: string, arrayName: string, index: number): void {
    this.getArray(groupName, arrayName).removeAt(index);
  }

  onCheckboxChange(groupName: string, arrayName: string, event: any) {
    const selectedValues = this.getArray(groupName, arrayName);
    if (event.target.checked) {
      selectedValues.push(new FormControl(event.target.value));
    } else {
      const index = selectedValues.controls.findIndex(x => x.value === event.target.value);
      selectedValues.removeAt(index);
    }
  }

  // --- Soumission ---
  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.errorMessage = 'Veuillez vérifier les informations saisies.';
      // Mark all as touched to show errors
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;

    if (this.selectedFile) {
      this.isUploading = true;
      this.fileStorageService.upload(this.selectedFile).pipe(
        finalize(() => this.isUploading = false)
      ).subscribe({
        next: (fileUrl) => {
          this.getGroup('infosPersonnelles').get('photoProfilUrl')?.setValue(fileUrl);
          this.registerUser();
        },
        error: (err: any) => {
          this.errorMessage = "Erreur lors de l'upload de l'image.";
          console.error(err);
        }
      });
    } else {
      this.registerUser();
    }
  }

  private registerUser(): void {
    const infos = this.getGroup('infosPersonnelles').value;
    const type = this.signUpForm.value.typeUtilisateur as TypeUtilisateur;
    const { confirmPassword, ...infosSansConfirmation } = infos;

    // Construire explicitement le payload pour respecter RegisterRequestDto
    let payload: RegisterRequestDto;

    if (type === TypeUtilisateur.FREELANCE) {
      const f = this.getGroup('detailsFreelance').value;
      payload = {
        // Champs communs
        nom: infosSansConfirmation.nom,
        prenom: infosSansConfirmation.prenom,
        email: infosSansConfirmation.email,
        password: infosSansConfirmation.password,
        typeUtilisateur: type,
        numeroTelephone: infosSansConfirmation.numeroTelephone,
        photoProfilUrl: infosSansConfirmation.photoProfilUrl,
        languePref: infosSansConfirmation.languePref,
        gouvernorat: infosSansConfirmation.gouvernorat,
        linkedinUrl: infosSansConfirmation.linkedinUrl,
        githubUrl: infosSansConfirmation.githubUrl,
        // Champs freelance
        titreProfil: f.titreProfil,
        competences: f.competences,
        tarifHoraire: f.tarifHoraire,
        tarifJournalier: f.tarifJournalier,
        disponibilite: f.disponibilite,
        bio: f.bio,
        niveauExperience: f.niveauExperience,
        localisation: infosSansConfirmation.localisation,
        categories: f.categories,
        portfolioUrls: f.portfolioUrls,
        pushTokens: f.pushTokens
      };
    } else {
      const c = this.getGroup('detailsClient').value;
      payload = {
        // Champs communs
        nom: infosSansConfirmation.nom,
        prenom: infosSansConfirmation.prenom,
        email: infosSansConfirmation.email,
        password: infosSansConfirmation.password,
        typeUtilisateur: type,
        typeClient: this.getControl('typeClient').value,
        numeroTelephone: infosSansConfirmation.numeroTelephone,
        photoProfilUrl: infosSansConfirmation.photoProfilUrl,
        languePref: infosSansConfirmation.languePref,
        gouvernorat: infosSansConfirmation.gouvernorat,
        linkedinUrl: infosSansConfirmation.linkedinUrl,
        githubUrl: infosSansConfirmation.githubUrl,
        // Champs client
        nomEntreprise: c.nomEntreprise,
        siteEntreprise: c.siteEntreprise,
        descriptionEntreprise: c.descriptionEntreprise
      };
    }

    this.authService.register(payload).subscribe({
      next: () => {
        // La redirection est gérée automatiquement par le service d'authentification
        // selon le type d'utilisateur (CLIENT ou FREELANCE)
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || "Une erreur s'est produite lors de l'inscription.";
        console.error('Sign-up error:', err);
        this.currentStep = 1; // Revenir à l'étape avec email/password en cas d'erreur
      }
    });
  }
}