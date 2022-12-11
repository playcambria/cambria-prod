import type { Translation } from "../i18n-types";

const login: NonNullable<Translation["login"]> = {
    input: {
        name: {
            placeholder: "Trage deinen Namen ein",
            empty: "Kein Name angegeben",
        },
    },
    terms: 'Wenn du fortfährst, akzeptierst du die <a href="https://cambria.gg/terms-of-use" target="_blank">Nutzungsbedingungen</a>, <a href="https://cambria.gg/privacy-policy" target="_blank">Datenschutzerklärung</a> und <a href="https://cambria.gg/cookie-policy" target="_blank">Cookierichtlinien</a>.',
    continue: "Fortfahren",
};

export default login;
