import { unsubscribeByToken } from "@/lib/newsletter/subscriptions";

// Désinscription en un clic (RFC 8058) : les messageries qui affichent un
// bouton « Se désinscrire » à partir de l'en-tête List-Unsubscribe-Post
// appellent cette adresse en POST, sans passer par la page.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await unsubscribeByToken(token);
  return new Response(null, { status: 204 });
}
