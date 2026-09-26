import * as yup from "yup";

export const bardaSchema = yup.object({
  address: yup.string().trim().min(3, "La dirección debe venir del globo.").required("Falta la dirección."),
  notes: yup.string().trim().default(""),
  tipo: yup.string().oneOf(["PUBLICA", "PRIVADA"], "Elige si la barda es pública o privada.").required(),
  latitude: yup.number().min(-90).max(90).required("Falta la ubicación."),
  longitude: yup.number().min(-180).max(180).required("Falta la ubicación."),
  altoMetros: yup
    .number()
    .typeError("Captura el alto en metros.")
    .positive("El alto debe ser mayor a 0.")
    .max(500, "El alto máximo es 500 m.")
    .required("Captura el alto en metros."),
  anchoMetros: yup
    .number()
    .typeError("Captura el ancho en metros.")
    .positive("El ancho debe ser mayor a 0.")
    .max(500, "El ancho máximo es 500 m.")
    .required("Captura el ancho en metros."),
});

export const loginSchema = yup.object({
  email: yup.string().trim().email("Correo inválido.").required("Escribe el correo."),
  password: yup.string().min(4, "La contraseña es muy corta.").required("Escribe la contraseña."),
});
