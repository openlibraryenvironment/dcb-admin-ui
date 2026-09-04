export const adminOrConsortiumAdmin = ["CONSORTIUM_ADMIN", "ADMIN"];
// `allAdmins` used to widen this set with LIBRARY_ADMIN. With that role barred from
// DCB Admin entirely (see routes/__authenticated.tsx) the extra term was unreachable,
// and a constant whose name promises "all" while meaning "two of them" is worse than
// no constant. Callers now use adminOrConsortiumAdmin, or isConsortiumStaff().
export const adminOnly = "ADMIN";
