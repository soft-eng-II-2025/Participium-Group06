// compute initials: first + last or fallback
export function getInitials(first_name: string, last_name: string, username: string){
    const f = first_name?.trim();
    const l = last_name?.trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (username) return username.split(/[\s._-]/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
    return '?';
}