#!/usr/bin/env python3

import runpy
import sys
from pathlib import Path


def build_lookup_for_column(col_lower, frontmatter):
    lookup = {}

    if col_lower == "project":
        projects = frontmatter.get("projects", [])
        for p in projects:
            val = p.get("value", "").strip()
            lbl = p.get("label", "").strip()
            pfx = p.get("prefix", "").strip()
            canonical = lbl or val.replace("-", " ").replace("_", " ").title()
            if not canonical:
                continue

            lookup[canonical.lower()] = canonical
            if val:
                lookup[val.lower()] = canonical
                lookup[val.lower().replace("-", " ")] = canonical
                lookup[val.lower().replace("_", " ")] = canonical
            if pfx:
                lookup[pfx.lower()] = canonical
            if lbl:
                lookup[lbl.lower()] = canonical
                lookup[lbl.lower().replace(" ", "-")] = canonical
                lookup[lbl.lower().replace(" ", "_")] = canonical
                words = lbl.split()
                if len(words) > 1:
                    initials = "".join(w[0] for w in words).lower()
                    lookup[initials] = canonical
                    lookup[words[-1].lower()] = canonical

        if "cmn" not in lookup and "common" in lookup:
            lookup["cmn"] = lookup["common"]
        if "common" not in lookup and "cmn" in lookup:
            lookup["common"] = lookup["cmn"]

    elif col_lower == "status":
        statuses = frontmatter.get("task-statuses", [])
        for s in statuses:
            val = s.get("value", "").strip()
            lbl = s.get("label", "").strip()
            canonical = lbl or val.replace("-", " ").replace("_", " ").title()
            if not canonical:
                continue
            lookup[canonical.lower()] = canonical
            if val:
                lookup[val.lower()] = canonical
                lookup[val.lower().replace("-", " ")] = canonical
                lookup[val.lower().replace("_", " ")] = canonical
            if lbl:
                lookup[lbl.lower()] = canonical
                lookup[lbl.lower().replace(" ", "-")] = canonical
                lookup[lbl.lower().replace(" ", "_")] = canonical

        if "fixed" not in lookup and "done" in lookup:
            lookup["fixed"] = lookup["done"]
        if "done" not in lookup and "fixed" in lookup:
            lookup["done"] = lookup["fixed"]

    elif col_lower == "epic":
        epics = frontmatter.get("epics", [])
        for e in epics:
            val = e.get("value", "").strip()
            lbl = e.get("label", "").strip() or val.replace("-", " ").replace("_", " ").title()
            canonical = lbl or val
            if not canonical:
                continue
            lookup[canonical.lower()] = canonical
            if val:
                lookup[val.lower()] = canonical
                lookup[val.lower().replace("-", " ")] = canonical
                lookup[val.lower().replace("_", " ")] = canonical
            if lbl:
                lookup[lbl.lower()] = canonical
                lookup[lbl.lower().replace(" ", "-")] = canonical
                lookup[lbl.lower().replace(" ", "_")] = canonical

    elif col_lower == "subproject":
        subprojects = frontmatter.get("subprojects", [])
        for sp in subprojects:
            val = sp.get("value", "").strip()
            lbl = sp.get("label", "").strip() or val.replace("-", " ").replace("_", " ").title()
            canonical = lbl or val
            if not canonical:
                continue
            lookup[canonical.lower()] = canonical
            if val:
                lookup[val.lower()] = canonical
                lookup[val.lower().replace("-", " ")] = canonical
                lookup[val.lower().replace("_", " ")] = canonical
            if lbl:
                lookup[lbl.lower()] = canonical
                lookup[lbl.lower().replace(" ", "-")] = canonical
                lookup[lbl.lower().replace(" ", "_")] = canonical

    elif col_lower in ("type", "task-type"):
        types = frontmatter.get("task-types", [])
        for t in types:
            val = t.get("value", "").strip()
            lbl = t.get("label", "").strip() or val.replace("-", " ").replace("_", " ").title()
            pfx = t.get("prefix", "").strip()
            canonical = lbl or val
            if not canonical:
                continue
            lookup[canonical.lower()] = canonical
            if val:
                lookup[val.lower()] = canonical
            if pfx:
                lookup[pfx.lower()] = canonical
            if lbl:
                lookup[lbl.lower()] = canonical
                lookup[lbl.lower().replace(" ", "-")] = canonical
                lookup[lbl.lower().replace(" ", "_")] = canonical

    return lookup


def normalize_predicate(predicate, frontmatter_or_epics):
    column, separator, values = predicate.partition(":")
    if not separator:
        return predicate

    col_raw = column.strip()
    col_lower = col_raw.lower()

    if isinstance(frontmatter_or_epics, list):
        fm = {"epics": frontmatter_or_epics}
    elif isinstance(frontmatter_or_epics, dict):
        fm = frontmatter_or_epics
    else:
        fm = {}

    canonical_col_names = {
        "project": "Project",
        "status": "Status",
        "epic": "Epic",
        "subproject": "Subproject",
        "type": "Type",
        "task-type": "Type",
    }

    if col_lower not in canonical_col_names:
        return predicate

    lookup = build_lookup_for_column(col_lower, fm)
    if not lookup:
        return predicate

    normalized_vals = [
        lookup.get(v.strip().lower(), v.strip())
        for v in values.split(",")
    ]
    target_col = canonical_col_names[col_lower]
    return f"{target_col}:{','.join(normalized_vals)}"


def main():
    try:
        update = runpy.run_path(str(Path(__file__).resolve().parents[1] / "update-tasks"))
        text = Path(sys.argv[1]).read_text(encoding="utf-8")
        frontmatter = update["read_frontmatter"](text)
        for predicate in sys.argv[2:]:
            print(normalize_predicate(predicate, frontmatter))
    except (OSError, ValueError) as error:
        print(f"Error normalizing task filters: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

