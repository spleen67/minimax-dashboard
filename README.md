# Rugby Discipline — Analyse de match

Application front-end d'analyse arbitrale et disciplinaire pour un match de rugby.

## Lancement

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
npm run preview
```

## Format JSON

```json
{
  "events": [
    {
      "id": "event-1",
      "time": 12,
      "type": "Penalty Conceded",
      "team": "HOME",
      "detail": "Plongeon"
    }
  ],
  "homeTeamName": "Chartres",
  "awayTeamName": "Le Rheu",
  "homeTeamColor": "#3b82f6",
  "awayTeamColor": "#64748b",
  "yellowCardDuration": 10,
  "whiteCardDuration": 10,
  "matchDate": "2025-12-14",
  "refereeName": "R GOU",
  "matchLevel": "FEDERAL 2"
}
```

## Règles métier

- Les événements sont triés chronologiquement avant calcul.
- `Half Time` détermine la mi-temps. Sinon, 40:00 est utilisé.
- `Full Time` détermine la fin. Sinon, 80 minutes est la durée minimale.
- Les scores comprennent Try, Penalty Try, Penalty Kick, Conversion et Drop Goal.
- Une fenêtre de vigilance couvre dix minutes et ne compte que les pénalités de la même équipe.
- Un carton de la même équipe dans la fenêtre neutralise l'alerte.
- Sans carton, trois pénalités déclenchent une observation, quatre une alerte et cinq ou plus une alerte rouge.
- Un avantage est catégorisé selon l'événement chronologique suivant :
  - score : `Advantage++` ;
  - événement non-score sous ou égal à 45 secondes : `Advantage-` ;
  - événement non-score après 45 secondes ou absence d'événement : `Advantage+`.
- L'indice d'indiscipline est configurable depuis le dashboard.

Toutes les données restent dans le navigateur. Aucun backend n'est nécessaire.
- Les points encaissés pendant l'infériorité numérique sont calculés à partir des cartons jaunes, blancs et rouges.

## Historique local des matchs

Les matchs importés peuvent être enregistrés dans l'historique local du
navigateur, avec IndexedDB.

- Ouvrir le menu `Historique` dans l'en-tête.
- Enregistrer manuellement le match courant.
- Activer ou désactiver l'enregistrement automatique des imports.
- Rechercher, sélectionner puis analyser un match sauvegardé.
- Télécharger ou supprimer un JSON de l'historique.

Le JSON original est conservé intact, notamment sa propriété `timeUnit`.
Toutes les données restent locales au navigateur : aucun backend n'est
utilisé. Vider les données de site du navigateur supprime l'historique.
