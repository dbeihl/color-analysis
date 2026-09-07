"""Derive original region samples from the pinned base Munsell renotation."""

from __future__ import annotations

import argparse
import hashlib
import json
import runpy
import subprocess
from pathlib import Path
from typing import Any

import colour
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "scripts/data/real.py"
DATA_SHA256 = "e3656c76f164d6e124d2c56a8449274ac3605390862066a5ab12a46a9cfdde1e"
SOURCES = [
    "https://www.rit.edu/science/"
    "munsell-color-science-lab-educational-resources",
    "https://github.com/colour-science/colour/blob/v0.4.6/"
    "colour/notation/datasets/munsell/real.py",
    "docs/palette-derivation.md",
]
HUE_FAMILIES = ("R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP")
RECIPES = (
    ("light-spring", "spring", "value", 0.5, 0.7, -0.2),
    ("true-spring", "spring", "hue", 1.0, 0.3, 0.3),
    ("bright-spring", "spring", "chroma", 0.5, 0.0, 0.8),
    ("light-summer", "summer", "value", -0.5, 0.7, -0.2),
    ("true-summer", "summer", "hue", -1.0, 0.3, 0.3),
    ("soft-summer", "summer", "chroma", -0.5, 0.0, -0.7),
    ("soft-autumn", "autumn", "chroma", 0.5, 0.0, -0.7),
    ("true-autumn", "autumn", "hue", 1.0, 0.0, 0.3),
    ("deep-autumn", "autumn", "value", 0.5, -0.7, 0.3),
    ("deep-winter", "winter", "value", -0.5, -0.7, 0.3),
    ("true-winter", "winter", "hue", -1.0, -0.3, 0.3),
    ("bright-winter", "winter", "chroma", -0.5, 0.0, 0.8),
)

NEIGHBOR_RING = (
    "light-spring",
    "true-spring",
    "bright-spring",
    "bright-winter",
    "true-winter",
    "deep-winter",
    "deep-autumn",
    "true-autumn",
    "soft-autumn",
    "soft-summer",
    "true-summer",
    "light-summer",
)


def hue_family(hue: str) -> str:
    """Extract a Munsell hue's letter family."""
    return hue.lstrip("0123456789.")


def sort_key(sample: dict[str, Any]) -> tuple[float, float, float]:
    """Order dataset samples around the Munsell hue circle, then V and C."""
    item = sample["munsell"]
    family = hue_family(item["hue"])
    position = HUE_FAMILIES.index(family) * 10.0
    position += float(item["hue"][: -len(family)])
    return position, item["value"], item["chroma"]


def read_samples() -> list[dict[str, Any]]:
    """Prepare Illuminant C data using Colour, then convert with Culori."""
    if hashlib.sha256(DATA.read_bytes()).hexdigest() != DATA_SHA256:
        raise ValueError("Munsell source checksum mismatch")
    records = runpy.run_path(str(DATA))["MUNSELL_COLOURS_REAL"]
    illuminants = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]
    white_c = colour.xy_to_XYZ(illuminants["C"])
    white_d65 = colour.xy_to_XYZ(illuminants["D65"])
    prepared = []
    for (hue, value, chroma), xy_y in records:
        xy_y = np.array(xy_y, dtype=float)
        xy_y[2] *= 0.975 / 100
        xyz = colour.adaptation.chromatic_adaptation_VonKries(
            colour.xyY_to_XYZ(xy_y), white_c, white_d65, transform="Bradford"
        )
        prepared.append(
            {
                "munsell": {"hue": hue, "value": value, "chroma": chroma},
                "xyz": xyz.tolist(),
            }
        )
    result = subprocess.run(
        ["node", str(ROOT / "scripts/convert-munsell.mjs")],
        input=json.dumps(prepared),
        text=True,
        capture_output=True,
        check=True,
        cwd=ROOT,
        timeout=60,
    )
    return sorted(json.loads(result.stdout), key=sort_key)


def choose(
    candidates: list[dict[str, Any]], count: int, label: str
) -> list[dict[str, Any]]:
    """Take evenly spaced indices in the sorted, eligible dataset rows."""
    if len(candidates) < count:
        raise ValueError(
            f"{label}: need {count} samples, got {len(candidates)}"
        )
    return [
        candidates[index * (len(candidates) - 1) // (count - 1)]
        for index in range(count)
    ]


def derive(samples: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sample each declared region and assign documented garment roles."""
    output = []
    for identifier, family, dominant, hue, value, chroma in RECIPES:
        hues = (
            ["R", "YR", "Y", "GY", "G"]
            if hue > 0
            else ["G", "BG", "B", "PB", "P", "RP"]
        )
        if hue == 1:
            hues = ["YR", "Y", "GY", "G"]
        elif hue == -1:
            hues = ["G", "B", "PB", "P"]
        values = {
            -0.7: [2, 4],
            -0.3: [3, 5],
            0.0: [4, 6],
            0.3: [5, 7],
            0.7: [7, 9],
        }[value]
        core, accents, statements = {
            -0.7: ([4, 8], [6, 6], [8, 8]),
            -0.2: ([6, 8], [6, 6], [8, 8]),
            0.3: ([6, 10], [6, 8], [10, 10]),
            0.8: ([10, 16], [10, 12], [14, 16]),
        }[chroma]
        core_region = {
            "hueFamilies": hues,
            "value": values,
            "chroma": core,
        }
        eligible = [
            sample
            for sample in samples
            if sample["inGamut"]
            and values[0] <= sample["munsell"]["value"] <= values[1]
        ]
        roles = [
            ("metal", 2, ["YR", "Y"] if hue > 0 else ["B", "PB"], 2, 2),
            ("denim", 2, ["B", "PB"], 4, 4),
            ("base-neutral", 8, hues, 2, 2),
            ("secondary-neutral", 4, hues, 4, 4),
            ("accent", 24, hues, accents[0], accents[1]),
            ("statement", 8, hues, statements[0], statements[1]),
        ]
        palette: list[dict[str, Any]] = []
        used = set()
        for role, count, families, minimum, maximum in roles:
            candidates = [
                sample
                for sample in eligible
                if hue_family(sample["munsell"]["hue"]) in families
                and minimum <= sample["munsell"]["chroma"] <= maximum
                and sort_key(sample) not in used
            ]
            for sample in choose(candidates, count, f"{identifier}/{role}"):
                used.add(sort_key(sample))
                notation = sample["munsell"]
                name = (
                    f"{notation['hue']} {notation['value']:g}/"
                    f"{notation['chroma']:g}"
                )
                palette.append(
                    {
                        "name": name,
                        "lab": sample["lab"],
                        "role": role,
                        "nearFace": role in {"accent", "secondary-neutral"},
                        "munsell": notation,
                    }
                )
        output.append(
            {
                "id": identifier,
                "family": family,
                "dominant": dominant,
                "axes": {"hue": hue, "value": value, "chroma": chroma},
                "coreRegion": core_region,
                "neighbors": [
                    NEIGHBOR_RING[(NEIGHBOR_RING.index(identifier) - 1) % 12],
                    NEIGHBOR_RING[(NEIGHBOR_RING.index(identifier) + 1) % 12],
                ],
                "sources": SOURCES,
                "palette": palette,
            }
        )
    return output


def main() -> None:
    """Write deterministic palettes, or exit nonzero if output has drifted."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument(
        "--output", type=Path, default=ROOT / "src/knowledge/seasons.json"
    )
    args = parser.parse_args()
    content = (
        json.dumps(derive(read_samples()), indent=2, allow_nan=False) + "\n"
    )
    destination = args.output
    if args.check:
        if not destination.is_file():
            raise SystemExit(f"{destination} does not exist")
        if destination.read_bytes() != content.encode():
            raise SystemExit(
                "seasons.json differs from pinned Munsell derivation"
            )
        print("seasons.json matches pinned Munsell derivation")
    else:
        destination.write_bytes(content.encode())
        print("Wrote 12 palettes, 48 traceable Munsell samples each")


if __name__ == "__main__":
    main()
