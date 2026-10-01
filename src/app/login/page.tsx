"use client";

import { useRef } from "react";
import { Formik, type FormikHelpers } from "formik";
import { signIn } from "next-auth/react";
import { loginSchema, yupToFormErrors } from "@/lib/validations";

type LoginValues = {
  email: string;
  password: string;
};

async function enter(values: LoginValues, helpers: FormikHelpers<LoginValues>) {
  const parsed = await loginSchema.validate(values);
  const result = await signIn("credentials", {
    email: parsed.email,
    password: parsed.password,
    redirect: false,
  });
  if (!result || result.error || result.ok === false) {
    helpers.setStatus(
      result?.error === "Inactiva"
        ? "Esta cuenta está desactivada."
        : result?.error && result.error !== "CredentialsSignin"
          ? "No se pudo comprobar la cuenta. Intenta de nuevo."
          : "Usuario o contraseña incorrectos."
    );
    return;
  }
  window.location.assign("/");
}

export default function LoginPage() {
  const draft = useRef<LoginValues>({ email: "", password: "" });

  return (
    <Formik<LoginValues>
      initialValues={{ email: "", password: "" }}
      validate={() => {
        try {
          loginSchema.validateSync(draft.current, { abortEarly: false });
          return {};
        } catch (error) {
          return yupToFormErrors(error) ?? { email: "Revisa los datos." };
        }
      }}
      onSubmit={async (_values, helpers) => {
        helpers.setStatus(null);
        try {
          await enter(draft.current, helpers);
        } catch {
          helpers.setStatus("No se pudo iniciar sesión.");
        }
      }}
    >
      {({ errors, touched, isSubmitting, status, submitForm }) => (
        <form
          className="panel space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            draft.current = {
              email: String(data.get("email") ?? ""),
              password: String(data.get("password") ?? ""),
            };
            void submitForm();
          }}
        >
          <div className="flex items-center gap-3">
            <span className="brush-mark" aria-hidden="true" />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--header)]">EraseOn</h1>
              <p className="text-sm text-[var(--muted)]">Entra con tu usuario para registrar bardas.</p>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">Usuario</label>
            <input id="email" name="email" type="text" autoComplete="username" autoCapitalize="none" className="field mt-1" placeholder="admin" />
            {touched.email && errors.email ? <p className="error mt-1">{errors.email}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" className="field mt-1" />
            {touched.password && errors.password ? <p className="error mt-1">{errors.password}</p> : null}
          </div>
          {typeof status === "string" && status ? <p className="error">{status}</p> : null}
          <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}
    </Formik>
  );
}
