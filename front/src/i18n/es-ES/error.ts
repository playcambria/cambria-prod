import type { Translation } from "../i18n-types";

const error: NonNullable<Translation["error"]> = {
    accessLink: {
        title: "Enlace de acceso incorrecto",
        subTitle: "No se encontró el mapa. Por favor, revise su enlace de acceso.",
        details:
            "Si quiere más información, puede contactar con el administrador o contacte con nosotros en: hello@cambria.gg",
    },
    connectionRejected: {
        title: "Conexión rechazada",
        subTitle: "No puede unirse al Mundo. Inténtelo de nuevo más tarde {error}.",
        details:
            "Si quiere más información, puede contactar con el administrador o contacte con nosotros en: hello@cambria.gg",
    },
    connectionRetry: {
        unableConnect: "No se pudo conectar con Cambria. ¿Está conectado a internet?",
    },
    error: "Error",
};

export default error;
