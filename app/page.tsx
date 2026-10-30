import { QuoteForm } from "./QuoteForm";

export default function HomePage() {
  return (
    <main>
      <header>
        <h1>Assistant de chiffrage automatisation</h1>
        <p>
          Décrivez un besoin métier en une ou deux phrases. Un modèle NVIDIA Nemotron,
          servi par Nebius Token Factory, propose un brouillon de devis structuré,
          modules, fourchette de prix, abonnement mensuel et questions restant à
          clarifier avant de le transmettre au client.
        </p>
      </header>
      <QuoteForm />
      <footer>
        Projet de démonstration pour le Nebius x NVIDIA Global AI Hackathon. Le brouillon
        généré reste à valider par un humain avant tout envoi à un client.
      </footer>
    </main>
  );
}
