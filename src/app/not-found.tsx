// URL à un seul segment qui n'est pas une locale (p. ex. /wp-login.php) : le
// segment [locale] la capte, son layout appelle notFound() et c'est cette
// frontière racine qui répond — même écran bilingue que global-not-found.
export { default, metadata } from "./global-not-found";
