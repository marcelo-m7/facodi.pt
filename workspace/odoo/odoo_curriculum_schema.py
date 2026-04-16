from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PlaylistRef:
    id: str
    priority: int = 1


@dataclass
class TopicRecord:
    slug: str
    name: str
    summary: str = ""
    tags: List[str] = field(default_factory=list)
    playlists: List[PlaylistRef] = field(default_factory=list)


@dataclass
class UCRecord:
    code: str
    title: str
    ects: float
    semester: Optional[int] = None
    year: Optional[int] = None
    language: str = "pt"
    summary: str = ""
    description: str = ""
    prerequisites: List[str] = field(default_factory=list)
    learning_outcomes: List[str] = field(default_factory=list)
    playlists: List[PlaylistRef] = field(default_factory=list)
    topics: List[TopicRecord] = field(default_factory=list)


@dataclass
class CourseRecord:
    code: str
    title: str
    plan_version: str
    ects_total: float
    duration_semesters: int
    institution: str
    school: str
    language: str = "pt"
    summary: str = ""
    uc_refs: List[str] = field(default_factory=list)


@dataclass
class CurriculumBundle:
    source: str
    course: CourseRecord
    ucs: List[UCRecord]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def validate(self) -> None:
        if not self.course.code:
            raise ValueError("Course code is required")
        if self.course.ects_total <= 0:
            raise ValueError("Course ECTS total must be > 0")
        if self.course.duration_semesters <= 0:
            raise ValueError("Course duration_semesters must be > 0")

        seen_codes = set()
        for uc in self.ucs:
            if not uc.code:
                raise ValueError("UC code is required")
            if uc.code in seen_codes:
                raise ValueError(f"Duplicate UC code: {uc.code}")
            seen_codes.add(uc.code)
            if uc.ects <= 0:
                raise ValueError(f"UC ECTS must be > 0 for {uc.code}")


def playlist_from_dict(data: Dict[str, Any]) -> PlaylistRef:
    return PlaylistRef(
        id=str(data.get("id", "")).strip(),
        priority=int(data.get("priority", 1) or 1),
    )


def topic_from_dict(data: Dict[str, Any]) -> TopicRecord:
    playlists = [playlist_from_dict(x) for x in data.get("playlists", []) if isinstance(x, dict)]
    tags = [str(x).strip() for x in data.get("tags", []) if str(x).strip()]
    return TopicRecord(
        slug=str(data.get("slug", "")).strip(),
        name=str(data.get("name", "")).strip(),
        summary=str(data.get("summary", "")).strip(),
        tags=tags,
        playlists=playlists,
    )


def uc_from_dict(data: Dict[str, Any]) -> UCRecord:
    playlists_key = "playlists" if isinstance(data.get("playlists"), list) else "youtube_playlists"
    playlists = [playlist_from_dict(x) for x in data.get(playlists_key, []) if isinstance(x, dict)]
    topics = [topic_from_dict(x) for x in data.get("topics", []) if isinstance(x, dict)]

    prerequisites = []
    for item in data.get("prerequisites", []):
        if isinstance(item, dict):
            value = str(item.get("code") or item.get("value") or "").strip()
        else:
            value = str(item).strip()
        if value:
            prerequisites.append(value)

    outcomes = []
    for item in data.get("learning_outcomes", []):
        if isinstance(item, dict):
            value = str(item.get("outcome") or item.get("text") or item.get("value") or "").strip()
        else:
            value = str(item).strip()
        if value:
            outcomes.append(value)

    return UCRecord(
        code=str(data.get("code", "")).strip(),
        title=str(data.get("title", "")).strip(),
        ects=float(data.get("ects", 0) or 0),
        semester=int(data["semester"]) if data.get("semester") is not None else None,
        year=int(data["year"]) if data.get("year") is not None else None,
        language=str(data.get("language", "pt") or "pt").strip(),
        summary=str(data.get("summary", "")).strip(),
        description=str(data.get("description", "")).strip(),
        prerequisites=prerequisites,
        learning_outcomes=outcomes,
        playlists=playlists,
        topics=topics,
    )


def course_from_dict(data: Dict[str, Any]) -> CourseRecord:
    uc_refs = []
    for uc in data.get("ucs", []):
        if isinstance(uc, dict) and uc.get("code"):
            uc_refs.append(str(uc["code"]).strip())

    return CourseRecord(
        code=str(data.get("code", "")).strip(),
        title=str(data.get("title", "")).strip(),
        plan_version=str(data.get("plan_version", "")).strip(),
        ects_total=float(data.get("ects_total", 0) or 0),
        duration_semesters=int(data.get("duration_semesters", 0) or 0),
        institution=str(data.get("institution", "")).strip(),
        school=str(data.get("school", "")).strip(),
        language=str(data.get("language", "pt") or "pt").strip(),
        summary=str(data.get("summary", "")).strip(),
        uc_refs=uc_refs,
    )
