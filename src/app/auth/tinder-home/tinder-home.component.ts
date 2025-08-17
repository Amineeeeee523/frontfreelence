import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tinder-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './tinder-home.component.html',
  styleUrl: './tinder-home.component.scss'
})
export class TinderHomeComponent implements OnInit, OnDestroy {
  currentLang: 'fr' | 'en' = 'fr';
  isNavbarVisible = true;
  lastScrollY = 0;

  content = {
    fr: {
      logo: 'Promatch',
      nav: ['Produits', 'En savoir plus', 'Sécurité', 'Assistance', 'Télécharger'],
      login: 'Connexion',
      createAccount: 'Créer un compte',
      heroTitle: 'Swipez. Matchez. Collaborez.',
      cta: 'Créer un compte',
      aboutTitle: 'Qu\'est-ce que Promatch ?',
      aboutText: 'Promatch est la première plateforme en Tunisie qui réinvente la collaboration professionnelle. Notre mission est de connecter les talents les plus brillants avec les entreprises les plus innovantes, des startups agiles aux grandes sociétés, en passant par les agences créatives.',
      features: [
        { icon: 'swipe', title: 'Matching Intelligent', text: 'Swipez à travers des profils et des missions pour trouver la correspondance parfaite.' },
        { icon: 'chat', title: 'Messagerie Intégrée', text: 'Collaborez en temps réel avec une messagerie simple et efficace.' },
        { icon: 'security', title: 'Paiement Sécurisé', text: 'Travaillez en toute confiance grâce à notre système d\'escrow via Paymee.' }
      ],
      testimonialsTitle: 'Ce qu\'ils disent de nous',
      footerSections: {
        legal: 'Mentions légales',
        employment: 'Emploi',
        social: 'Réseaux sociaux',
        faq: 'FAQ'
      },
      footerLinks: {
        legal: ['Confidentialité', 'Conditions d\'utilisation', 'Politique cookies'],
        employment: ['Espace emploi', 'Blog technique'],
        faq: ['Mes destinations', 'Espace presse', 'Contact']
      }
    },
    en: {
      logo: 'Promatch',
      nav: ['Products', 'Learn More', 'Safety', 'Support', 'Download'],
      login: 'Log In',
      createAccount: 'Create Account',
      heroTitle: 'Swipe. Match. Collaborate.',
      cta: 'Create Account',
      aboutTitle: 'What is Promatch?',
      aboutText: 'Promatch is the first platform in Tunisia that reinvents professional collaboration. Our mission is to connect the brightest talents with the most innovative companies, from agile startups to large corporations and creative agencies.',
      features: [
        { icon: 'swipe', title: 'Intelligent Matching', text: 'Swipe through profiles and missions to find the perfect match.' },
        { icon: 'chat', title: 'Integrated Messaging', text: 'Collaborate in real-time with simple and effective messaging.' },
        { icon: 'security', title: 'Secure Payment', text: 'Work with confidence thanks to our escrow system via Paymee.' }
      ],
      testimonialsTitle: 'What they say about us',
      footerSections: {
        legal: 'Legal',
        employment: 'Jobs',
        social: 'Social',
        faq: 'FAQ'
      },
      footerLinks: {
        legal: ['Privacy', 'Terms of Use', 'Cookie Policy'],
        employment: ['Careers', 'Tech Blog'],
        faq: ['Our Destinations', 'Press Room', 'Contact']
      }
    }
  };

  testimonials = [
    {
      name: 'Mariem, Développeuse Web à Tunis',
      quote: {
        fr: 'Promatch a transformé ma carrière ! En quelques swipes, j\'ai trouvé des clients sérieux et des projets passionnants. Le système de paiement avec Paymee me rassure totalement. Je recommande à tous les freelances !',
        en: 'Promatch transformed my career! With just a few swipes, I found serious clients and exciting projects. The Paymee payment system gives me complete peace of mind. I recommend it to all freelancers!'
      }
    },
    {
      name: 'Ahmed, CEO d\'une startup fintech',
      quote: {
        fr: 'Révolutionnaire ! Au lieu de passer des semaines à chercher, j\'ai trouvé une équipe de freelances talentueux en 2 jours sur Promatch. L\'interface est intuitive et le suivi des projets est parfait pour notre startup.',
        en: 'Revolutionary! Instead of spending weeks searching, I found a team of talented freelancers in 2 days on Promatch. The interface is intuitive and project tracking is perfect for our startup.'
      }
    },
    {
      name: 'Yasmine, Designer Graphique à Sfax',
      quote: {
        fr: 'J\'étais sceptique au début, mais Promatch m\'a donné confiance en moi. Mon premier gros contrat en architecture de marque, je l\'ai décroché grâce à cette plateforme. Simple, rapide, efficace !',
        en: 'I was skeptical at first, but Promatch gave me confidence. I landed my first big brand architecture contract thanks to this platform. Simple, fast, efficient!'
      }
    }
  ];

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const currentScrollY = window.scrollY;
    
    // Seuil pour éviter les micro-mouvements
    const scrollThreshold = 10;
    
    if (Math.abs(currentScrollY - this.lastScrollY) < scrollThreshold) {
      return;
    }

    // Scroll vers le bas - cacher le navbar
    if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
      this.isNavbarVisible = false;
    }
    // Scroll vers le haut - montrer le navbar
    else if (currentScrollY < this.lastScrollY) {
      this.isNavbarVisible = true;
    }

    this.lastScrollY = currentScrollY;
  }

  ngOnInit() {
    this.lastScrollY = window.scrollY;
  }

  ngOnDestroy() {
    // Nettoyage si nécessaire
  }

  switchLang(lang: 'fr' | 'en'): void {
    this.currentLang = lang;
  }
}
