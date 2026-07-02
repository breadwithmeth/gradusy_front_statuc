const META_MARKER = "gradusy24-entry-link-meta";

type EntryLinkMeta = {
  description: string;
  actionIds?: string[];
};

type EncodedEntryLinkMeta = EntryLinkMeta & {
  type: typeof META_MARKER;
  version: 1;
};

function uniqueActionIds(actionIds: string[] | undefined) {
  if (!actionIds) {
    return undefined;
  }

  return Array.from(new Set(actionIds.filter(Boolean)));
}

export function parseEntryLinkDescription(value: string | null | undefined): EntryLinkMeta {
  if (!value) {
    return { description: "" };
  }

  try {
    const payload = JSON.parse(value) as Partial<EncodedEntryLinkMeta>;

    if (payload.type !== META_MARKER || payload.version !== 1) {
      return { description: value };
    }

    return {
      description: typeof payload.description === "string" ? payload.description : "",
      actionIds: uniqueActionIds(payload.actionIds)
    };
  } catch {
    return { description: value };
  }
}

export function encodeEntryLinkDescription(meta: EntryLinkMeta) {
  const actionIds = uniqueActionIds(meta.actionIds);

  if (!actionIds) {
    return meta.description;
  }

  const payload: EncodedEntryLinkMeta = {
    type: META_MARKER,
    version: 1,
    description: meta.description,
    actionIds
  };

  return JSON.stringify(payload);
}

export function publicEntryLink<EntryLink extends { description: string | null }>(entryLink: EntryLink) {
  const meta = parseEntryLinkDescription(entryLink.description);

  return {
    ...entryLink,
    description: meta.description,
    actionIds: meta.actionIds
  };
}
