import type { Translation } from "../i18n-types";

const login: NonNullable<Translation["login"]> = {
    input: {
        name: {
            placeholder: "Entrez votre nom",
            empty: "Le nom est vide",
        },
    },
    terms: 'En continuant, vous acceptez nos <a href="https://cambria.gg/terms-of-use" target="_blank">conditions d\'utilisation</a>, notre <a href="https://cambria.gg/privacy-policy" target="_blank">politique de confidentialité</a> et notre <a href="https://cambria.gg/cookie-policy" target="_blank">politique relative aux cookies</a>.',
    continue: "Continuer",
};

export default login;
