# 🎨 Variantes de Titre pour MissionDetailComponent

Ce document explique comment utiliser et basculer entre les deux variantes de style pour le titre de mission.

## 📋 Vue d'ensemble

Deux variantes ont été créées pour améliorer la lisibilité, le contraste et l'élégance du titre de mission tout en conservant l'identité mauve/cyan :

- **Variante A** : Titre en encre + soulignement dégradé
- **Variante B** : Titre en mauve-800 + stroke 1px

## 🎯 Variante A : Titre encre + soulignement dégradé

### Caractéristiques
- **Couleur** : Encre quasi-noire (`#0F172A`)
- **Accent** : Soulignement dégradé mauve→cyan
- **Contraste** : ~15:1 (excellent, dépasse AAA)
- **Lisibilité** : Parfaite sur tous les écrans
- **Design** : Épuré et élégant

### Code SCSS
```scss
.mission-title {
  color: var(--title-ink);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-500), var(--info-500));
    border-radius: var(--radius-sm);
    opacity: 0.8;
    transform: scaleX(0.8);
    transition: transform var(--transition-normal);
  }
  
  &:hover::after {
    transform: scaleX(1);
  }
}
```

## 🎯 Variante B : Titre mauve + stroke

### Caractéristiques
- **Couleur** : Mauve sombre (`#6D28D9`)
- **Accent** : Stroke blanc 35% + barre cyan
- **Contraste** : ~6:1 (bon, dépasse AA)
- **Identité** : Mauve forte et marquée
- **Design** : Premium avec effets subtils

### Code SCSS
```scss
.mission-title {
  color: var(--title-mauve-800);
  text-shadow: 
    1px 1px 0 var(--title-stroke),
    -1px -1px 0 var(--title-stroke),
    1px -1px 0 var(--title-stroke),
    -1px 1px 0 var(--title-stroke);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 60%;
    height: 2px;
    background: var(--info-500);
    border-radius: var(--radius-sm);
    opacity: 0.6;
    transform: scaleX(0.7);
    transition: transform var(--transition-normal);
  }
  
  &:hover::after {
    transform: scaleX(1);
  }
}
```

## 🔄 Comment basculer entre les variantes

### Option 1 : Remplacement direct dans le fichier principal

1. Ouvrez `mission-detail.component.scss`
2. Localisez la section `.mission-title`
3. Remplacez le contenu par la variante souhaitée

### Option 2 : Utilisation des classes CSS

1. Ajoutez la classe de variante dans le HTML :
```html
<h1 class="mission-title mission-title--variant-a">
  {{ mission()?.titre }}
</h1>
```

2. Importez le fichier de variantes dans votre SCSS principal :
```scss
@import './mission-title-variants.scss';
```

## 📱 Responsive Design

Les deux variantes s'adaptent automatiquement aux écrans mobiles :

- **Desktop** : 28-32px, line-height 1.2
- **Mobile** : 24-26px, line-height 1.3
- **Gestion des longs titres** : 2 lignes max + ellipsis + tooltip

## ♿ Accessibilité

- **Contraste AA garanti** sur toutes les variantes
- **Focus visible** sur les éléments interactifs
- **ARIA labels** pour les tooltips
- **WCAG 2.1 AA** respecté

## 🧪 Test et démonstration

### Fichier de démo HTML
Ouvrez `title-variants-demo.html` dans un navigateur pour tester les deux variantes côte à côte.

### Fichier de variantes SCSS
Consultez `mission-title-variants.scss` pour voir le code complet des deux variantes.

## 🎨 Personnalisation

### Modifier les couleurs
Ajustez les variables SCSS dans `:host` :
```scss
--title-ink: #0F172A;           // Couleur encre
--title-mauve-800: #6D28D9;     // Couleur mauve
--title-stroke: rgba(255, 255, 255, 0.35); // Opacité stroke
```

### Modifier les dimensions
Ajustez les variables de spacing et de radius :
```scss
--space-4: 16px;                // Espacement sous le titre
--radius-sm: 6px;               // Rayon du soulignement
```

## 📊 Comparaison des variantes

| Aspect | Variante A | Variante B |
|--------|------------|------------|
| **Lisibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Contraste** | ⭐⭐⭐⭐⭐ (15:1) | ⭐⭐⭐⭐ (6:1) |
| **Identité mauve** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Design épuré** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Accessibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🏆 Recommandation

- **Variante A** : Pour une lisibilité maximale et un design épuré
- **Variante B** : Pour une identité mauve plus marquée et un effet premium

Les deux variantes respectent les standards d'accessibilité et offrent une expérience utilisateur de qualité.

## 🔧 Support technique

En cas de problème ou de question :
1. Vérifiez que toutes les variables SCSS sont définies
2. Testez la démo HTML pour valider le rendu
3. Consultez la console du navigateur pour d'éventuelles erreurs CSS
