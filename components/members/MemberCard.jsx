"use client";

import ImageWithFallback from "./ImageWithFallback";

export default function MemberCard({ member }) {
  return (
    <article className="member-card">
      <div className="member-image-wrap">
        <ImageWithFallback src={member.src} fallback={member.fallback} alt={member.name} className="member-image" />
      </div>
      <div className="member-info">
        <h3 className="member-name">{member.name}</h3>
        {member.role ? <p className="member-role">{member.role}</p> : null}
      </div>
    </article>
  );
}

