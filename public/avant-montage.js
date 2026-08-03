/*
  Retire le corps injecté de l'accueil quand le visiteur a un compte.

  Le middleware écrit dans `#root` un texte de catalogue destiné aux clients qui
  n'exécutent pas le JavaScript (§7). Sur une fiche film, ce texte ressemble à
  la page que React rendra, et sa disparition passe inaperçue. Sur `/`, non :
  connecté, React rend le tableau de bord, donc on voyait une liste de films
  s'afficher puis céder la place à un écran sans rapport, le temps que le
  bundle s'exécute.

  Ce n'est pas du cloaking : on ne distingue pas un robot d'un humain, on lit la
  session **du visiteur lui-même**, exactement ce que fait `compteProbable()`
  pour choisir l'écran. Un crawler n'a jamais de session, il reçoit donc le
  texte, intact.

  Volontairement servi comme fichier plutôt qu'en ligne dans `index.html` : la
  CSP autorise déjà `script-src 'self'`, là où un script en ligne demanderait un
  `sha256-` à recalculer à chaque retouche, qu'une seule espace de différence
  ferait échouer en silence.

  **La clé de stockage est écrite ici en toutes lettres**, alors que
  `lib/auth-config.ts` la compose. Deux sources pour une même valeur, et c'est
  assumé : ce fichier tourne avant tout module, il ne peut rien importer. Si
  elles divergent, on retombe simplement sur le comportement d'avant, le corps
  injecté clignote ; rien ne casse.
*/
(function () {
  try {
    if (location.pathname !== "/") return;
    var params = new URLSearchParams(location.search);
    var connecte =
      localStorage.getItem("sb-rndyusuyfkrojpazjsll-auth-token") !== null ||
      params.has("code") ||
      params.has("error");
    if (!connecte) return;
    var racine = document.getElementById("root");
    if (racine) racine.textContent = "";
  } catch (e) {
    /* Stockage indisponible : on ne touche à rien, le corps reste. */
  }
})();
