import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';


import { AuthService } from '../../services/auth.service';
import { RegisterRequestDto } from '../../models/register-request.model';
import { TypeUtilisateur, Disponibilite, NiveauExperience, Langue, TypeClient } from '../../models/utilisateur.model';
import { MissionCategorie } from '../../models/mission.model';
import { FileStorageService } from '../../services/file-storage.service';
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

  signUpForm!: FormGroup;
  currentStep = 0;
  errorMessage: string | null = null;
  profileImagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isUploading = false;

  // Enums pour le template
  TypeUtilisateur = TypeUtilisateur;
  Disponibilite = Disponibilite;
  NiveauExperience = NiveauExperience;
  Langue = Langue;
  TypeClient = TypeClient;
  MissionCategorie = MissionCategorie;
  missionCategories = Object.values(MissionCategorie);


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
        numeroTelephone: ['', Validators.pattern('[- +()0-9]+')],
        languePref: [Langue.FR, Validators.required],
        photoProfilUrl: ['']
      }, { validators: this.passwordMatchValidator }),

      // Étape 2: Détails spécifiques
      detailsFreelance: this.fb.group({
        competences: this.fb.array([]),
        tarifHoraire: ['', Validators.min(0)],
        tarifJournalier: ['', Validators.min(0)],
        niveauExperience: [NiveauExperience.DEBUTANT],
        disponibilite: [Disponibilite.INDISPONIBLE],
        localisation: [''],
        categories: this.fb.array([]),
        bio: [''],
        portfolioUrls: this.fb.array([]),
        pushTokens: this.fb.array([])
      }),
      detailsClient: this.fb.group({
        nomEntreprise: [''],
        siteEntreprise: ['', Validators.pattern('https?://.+')],
        descriptionEntreprise: ['']
      })
    });

    this.onTypeUtilisateurChange();
    this.onTypeClientChange();
  }

  onTypeUtilisateurChange(): void {
    this.signUpForm.get('typeUtilisateur')?.valueChanges.subscribe(val => {
      if (val === TypeUtilisateur.FREELANCE) {
        this.addFreelanceValidators();
        this.clearClientValidators();
        this.getControl('typeClient')?.clearValidators();
      } else {
        this.addClientValidators();
        this.clearFreelanceValidators();
        this.getControl('typeClient')?.setValidators(Validators.required);
      }
      this.getControl('typeClient')?.updateValueAndValidity();
    });
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
    this.getGroup('detailsFreelance').get('tarifHoraire')?.setValidators([Validators.required, Validators.min(0)]);
    this.getGroup('detailsFreelance').get('niveauExperience')?.setValidators(Validators.required);
    this.getGroup('detailsFreelance').get('disponibilite')?.setValidators(Validators.required);
    this.getGroup('detailsFreelance').get('localisation')?.setValidators(Validators.required);
    this.getGroup('detailsFreelance').updateValueAndValidity();
  }
  
  clearFreelanceValidators() {
    this.getGroup('detailsFreelance').get('tarifHoraire')?.clearValidators();
    this.getGroup('detailsFreelance').get('niveauExperience')?.clearValidators();
    this.getGroup('detailsFreelance').get('disponibilite')?.clearValidators();
    this.getGroup('detailsFreelance').get('localisation')?.clearValidators();
    this.getGroup('detailsFreelance').updateValueAndValidity();
  }

  addClientValidators() {
    this.getGroup('detailsClient').get('nomEntreprise')?.setValidators(Validators.required);
    this.getGroup('detailsClient').updateValueAndValidity();
  }

  clearClientValidators() {
    this.getGroup('detailsClient').get('nomEntreprise')?.clearValidators();
    this.getGroup('detailsClient').updateValueAndValidity();
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
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
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
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
          return typeUser.valid && typeClient.valid;
        }
        return typeUser!.valid;
      case 1: return this.getGroup('infosPersonnelles').valid;
      case 2:
        const type = this.signUpForm.get('typeUtilisateur')!.value;
        return type === TypeUtilisateur.FREELANCE 
          ? this.getGroup('detailsFreelance').valid
          : this.getGroup('detailsClient').valid;
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
    const type = this.signUpForm.value.typeUtilisateur;
    const { confirmPassword, ...infosSansConfirmation } = infos;
    let details: any;

    if (type === TypeUtilisateur.FREELANCE) {
      details = this.getGroup('detailsFreelance').value;
    } else {
      details = {
        ...this.getGroup('detailsClient').value,
        typeClient: this.getControl('typeClient').value
      };
    }
      
    const registerData: RegisterRequestDto = {
      ...infosSansConfirmation,
      ...details,
      typeUtilisateur: type,
    };
    
    this.authService.register(registerData).subscribe({
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
