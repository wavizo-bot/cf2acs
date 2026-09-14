import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACS Digital — Apoio ao Agente Comunitário de Saúde" },
      {
        name: "description",
        content:
          "Aplicativo de apoio ao Agente Comunitário de Saúde: visitas, cadastros e consultas. Funciona offline.",
      },
      { property: "og:title", content: "ACS Digital — Apoio ao Agente Comunitário de Saúde" },
      {
        property: "og:description",
        content:
          "Aplicativo de apoio ao Agente Comunitário de Saúde: visitas, cadastros e consultas. Funciona offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/acs-digital.html"
      title="ACS Digital"
      className="fixed inset-0 h-full w-full border-0"
    />
  );
}
