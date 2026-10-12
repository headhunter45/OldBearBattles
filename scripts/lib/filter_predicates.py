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

    elif col_lower in ("status", "group", "status-group"):
        statuses = frontmatter.get("task-statuses", [])
        group_to_statuses = {}
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

            raw_groups = s.get("groups", [])
            groups = [g.lower() for g in raw_groups] if isinstance(raw_groups, list) else [str(raw_groups).lower()]
            for g in groups:
                if g:
                    group_to_statuses.setdefault(g, []).append(canonical)

        for g, g_statuses in group_to_statuses.items():
            unique_statuses = []
            for item in g_statuses:
                if item not in unique_statuses:
                    unique_statuses.append(item)
            g_val = ",".join(unique_statuses)
            if col_lower in ("group", "status-group") or g not in lookup:
                lookup[g] = g_val
                lookup[g.replace("-", " ")] = g_val
                lookup[g.replace("_", " ")] = g_val
            else:
                existing = [x.strip() for x in lookup[g].split(",") if x.strip()]
                merged = list(dict.fromkeys(existing + unique_statuses))
                lookup[g] = ",".join(merged)
                lookup[g.replace("-", " ")] = lookup[g]
                lookup[g.replace("_", " ")] = lookup[g]

        if "planning" not in group_to_statuses:
            fallback_planning = [lookup[k] for k in ("planning", "triage") if k in lookup]
            if fallback_planning:
                lookup.setdefault("planning", ",".join(dict.fromkeys(fallback_planning)))
        if "initial" not in group_to_statuses:
            fallback_initial = [lookup[k] for k in ("triage", "planning") if k in lookup]
            if fallback_initial:
                lookup.setdefault("initial", ",".join(dict.fromkeys(fallback_initial)))
        if "ready" not in group_to_statuses:
            fallback_ready = [lookup[k] for k in ("ready", "pending", "in_progress", "in-progress") if k in lookup]
            if fallback_ready:
                lookup.setdefault("ready", ",".join(dict.fromkeys(fallback_ready)))

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
        "group": "Status",
        "status-group": "Status",
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


def format_predicate_list(preds):
    if len(preds) == 1:
        return f"'{preds[0]}'"
    if len(preds) == 2:
        return f"'{preds[0]}' and '{preds[1]}'"
    return ", ".join(f"'{p}'" for p in preds[:-1]) + f", and '{preds[-1]}'"


def validate_accept_predicates(normalized_accepts, raw_accepts=None):
    """
    Check if multiple accept predicates targeting the same column have no overlapping values.
    Raises ValueError if the intersection of allowed values for any column is empty.
    """
    if raw_accepts is None:
        raw_accepts = normalized_accepts

    col_values = {}
    col_raw_predicates = {}

    for raw_pred, norm_pred in zip(raw_accepts, normalized_accepts):
        if ":" not in norm_pred:
            continue

        col, _, vals = norm_pred.partition(":")
        canonical_col = col.strip()
        col_key = canonical_col.lower()

        val_list = [v.strip() for v in vals.split(",") if v.strip()]
        if not val_list:
            continue

        val_set = {v.lower() for v in val_list}

        if col_key not in col_values:
            col_values[col_key] = val_set
            col_raw_predicates[col_key] = [raw_pred]
        else:
            intersection = col_values[col_key] & val_set
            col_raw_predicates[col_key].append(raw_pred)
            if not intersection:
                preds_formatted = format_predicate_list(col_raw_predicates[col_key])
                raise ValueError(
                    f"Impossible filter: conflicting --accept predicates for '{canonical_col}' ({preds_formatted}) have no overlapping values."
                )
            col_values[col_key] = intersection


def main():
    try:
        if len(sys.argv) < 2:
            print("usage: filter_predicates.py <tasks_file> [--accept-count N] [predicates...]", file=sys.stderr)
            sys.exit(1)

        tasks_file = sys.argv[1]
        update = runpy.run_path(str(Path(__file__).resolve().parents[1] / "update-tasks"))
        text = Path(tasks_file).read_text(encoding="utf-8")
        frontmatter = update["read_frontmatter"](text)

        accept_count = None
        pred_args = []
        i = 2
        while i < len(sys.argv):
            arg = sys.argv[i]
            if arg == "--accept-count" and i + 1 < len(sys.argv):
                accept_count = int(sys.argv[i + 1])
                i += 2
            elif arg.startswith("--accept-count="):
                accept_count = int(arg.split("=", 1)[1])
                i += 1
            else:
                pred_args.append(arg)
                i += 1

        if accept_count is None:
            accept_raw = pred_args
            reject_raw = []
        else:
            accept_raw = pred_args[:accept_count]
            reject_raw = pred_args[accept_count:]

        accept_normalized = [normalize_predicate(p, frontmatter) for p in accept_raw]
        reject_normalized = [normalize_predicate(p, frontmatter) for p in reject_raw]

        validate_accept_predicates(accept_normalized, accept_raw)

        for p in accept_normalized:
            print(p)
        for p in reject_normalized:
            print(p)

    except OSError as error:
        print(f"Error normalizing task filters: {error}", file=sys.stderr)
        sys.exit(1)
    except ValueError as error:
        msg = str(error)
        if "Impossible filter" in msg:
            print(f"Error: {msg}", file=sys.stderr)
        else:
            print(f"Error normalizing task filters: {msg}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

