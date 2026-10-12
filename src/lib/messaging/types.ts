import type { Side, ThreadKind } from "./rules";

// Vues calculées côté serveur et envoyées au composant de conversation. Rien
// ici ne doit révéler une identité que le lecteur n'a pas le droit de voir :
// signatures, titres et droits sont déjà résolus pour lui.

export type AttachmentView = {
  id: string;
  name: string;
  size: number;
  removed: boolean;
  forwarded: boolean;
  href: string;
  /** Admin seulement : transfert possible vers l'autre fil du projet. */
  forward?: { target: "client" | "architect"; needsCheck: boolean };
};

export type MessageView = {
  id: string;
  mine: boolean;
  side: Side;
  authorLabel: string;
  body: string;
  createdAt: string;
  edited: boolean;
  deleted: boolean;
  /** Fin de la fenêtre de modification (ISO) pour mes messages, sinon null. */
  editableUntil: string | null;
  seen: boolean;
  attachments: AttachmentView[];
};

export type ThreadView = {
  id: string;
  kind: ThreadKind;
  title: string;
  subtitle: string;
  viewerSide: Side;
  writable: boolean;
  closed: boolean;
  anonymityReminder: boolean;
  messages: MessageView[];
  hasOlder: boolean;
};

export type ThreadSummary = {
  key: string;
  kind: ThreadKind;
  title: string;
  subtitle: string;
  lastMessageAt: string | null;
  unread: number;
  closed: boolean;
  href: string;
};

export type Viewer = {
  userId: string;
  role: "admin" | "client" | "architect";
  architectId: string | null;
};

export type ActionResult<T = object> = ({ ok: true } & T) | { error: string };
