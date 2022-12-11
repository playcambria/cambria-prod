import type { Translation } from "../i18n-types";

const login: NonNullable<Translation["login"]> = {
    input: {
        name: {
            placeholder: "Introduzca su nombre",
            empty: "El nombre está vacío",
        },
    },
    terms: 'Si continúa, está de acuerdo con nuestros <a href="https://cambria.gg/terms-of-use" target="_blank">términos de uso</a>, <a href="https://cambria.gg/privacy-policy" target="_blank">política de privacidad</a> y <a href="https://cambria.gg/cookie-policy" target="_blank">política de cookie</a>.',
    continue: "Continuar",
};

export default login;
