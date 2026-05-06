export const adminViewLabels = {
  identity: "Marca e identidad",
  catalog: "Oferta academica",
  people: "Administrativos",
  queue: "Queue",
  support: "Tickets y soporte",
  community: "Editorial y comunidad",
  sops: "SOPs",
  search: "Busqueda global",
};

export const adminViewIcons = {
  identity: "tag",
  catalog: "grid",
  queue: "inbox",
  people: "user-check",
  support: "help-circle",
  community: "message-square",
  sops: "file-text",
  search: "search",
};

export const adminNavigationGroups = [
  {
    label: "Core",
    items: ["identity", "catalog"],
  },
  {
    label: "Operacion",
    items: ["queue", "people", "support", "community"],
  },
  {
    label: "Herramientas",
    items: ["sops", "search"],
  },
];
