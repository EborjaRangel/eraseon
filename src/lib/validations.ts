import { ValidationError } from "yup";
import * as yup from "yup";

export const bardaSchema = yup.object({
  address: yup.string().trim().min(3, "La dirección debe venir del globo.").required("Falta la dirección."),
  notes: yup.string().trim().default(""),
  tipo: yup.string().oneOf(["PUBLICA", "PRIVADA"], "Elige si la barda es pública o privada.").required(),
  permisoFirmado: yup.boolean().default(false),
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
  colorGlobo: yup
    .string()
    .oneOf(["ROSA", "GRIS"], "Elige el color del globo: rosa o gris Oxford.")
    .required("Elige el color del globo: rosa o gris Oxford."),
});

export const bardaEdicionSchema = bardaSchema.shape({
  colorGlobo: yup
    .string()
    .oneOf(["ROSA", "GRIS", ""], "Elige el color del globo: rosa o gris Oxford.")
    .default(""),
});

export const usuarioSchema = yup.object({
  name: yup.string().trim().min(2, "Escribe el nombre.").required("Escribe el nombre."),
  email: yup.string().trim().lowercase().email("Correo inválido.").required("Escribe el correo."),
  password: yup.string().min(4, "La contraseña debe tener al menos 4 caracteres.").required("Escribe la contraseña."),
  role: yup.string().oneOf(["USUARIO", "ADMIN"], "Elige Usuario o Admin.").required(),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .min(2, "Escribe el usuario.")
    .required("Escribe el usuario."),
  password: yup.string().required("Escribe la contraseña."),
});

export const observacionSchema = yup.object({
  notes: yup.string().trim().max(2000, "La observación es muy larga.").default(""),
});

export function yupToFormErrors(error: unknown): Record<string, string> | null {
  if (!(error instanceof ValidationError)) return null;
  const errors: Record<string, string> = {};
  const list = error.inner.length > 0 ? error.inner : [error];
  for (const item of list) {
    if (item.path && !errors[item.path]) errors[item.path] = item.message;
  }
  return errors;
}
