"use client";

import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { usuarioSchema } from "@/lib/validations";

type UsuarioValues = {
  name: string;
  email: string;
  password: string;
  role: "USUARIO" | "ADMIN";
};

export function UsuarioForm() {
  const router = useRouter();

  return (
    <Formik<UsuarioValues>
      initialValues={{ name: "", email: "", password: "", role: "USUARIO" }}
      validationSchema={usuarioSchema}
      onSubmit={async (values, { setStatus, resetForm, setSubmitting }) => {
        setStatus(null);
        const parsed = await usuarioSchema.validate(values);
        const response = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        const data = await response.json().catch(() => ({}));
        setSubmitting(false);
        if (!response.ok) {
          setStatus(data.error ?? "No se pudo dar de alta al usuario.");
          return;
        }
        resetForm();
        router.refresh();
      }}
    >
      {({ errors, touched, isSubmitting, status, handleChange, handleBlur, values }) => (
        <Form className="panel grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nombre">Nombre</label>
            <input id="nombre" name="name" className="field mt-1" value={values.name} onChange={handleChange} onBlur={handleBlur} />
            {touched.name && errors.name ? <p className="error mt-1">{errors.name}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="correo">Correo</label>
            <input id="correo" name="email" type="email" className="field mt-1" value={values.email} onChange={handleChange} onBlur={handleBlur} />
            {touched.email && errors.email ? <p className="error mt-1">{errors.email}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="clave">Contraseña</label>
            <input id="clave" name="password" type="password" className="field mt-1" value={values.password} onChange={handleChange} onBlur={handleBlur} />
            {touched.password && errors.password ? <p className="error mt-1">{errors.password}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="rol">Tipo</label>
            <select id="rol" name="role" className="field mt-1" value={values.role} onChange={handleChange} onBlur={handleBlur}>
              <option value="USUARIO">Usuario</option>
              <option value="ADMIN">Admin</option>
            </select>
            {touched.role && errors.role ? <p className="error mt-1">{errors.role}</p> : null}
          </div>
          {typeof status === "string" && status ? <p className="error sm:col-span-2">{status}</p> : null}
          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Dar de alta"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
