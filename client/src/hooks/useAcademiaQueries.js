import { useQuery } from "@tanstack/react-query";
import { adminService, progressService, subjectService, tenantService } from "../services/api";

const userKey = (user) => user?._id || user?.id;
const academicScope = (user) => [
  user?.tenant?._id || user?.tenant || "",
  user?.track || "",
  user?.branch || "",
  user?.semester || "",
  user?.targetExam || "",
];

export const queryKeys = {
  tenants: ["tenants"],
  studentSubjects: (user) => ["studentSubjects", userKey(user), ...academicScope(user)],
  globalProgress: (user) => ["globalProgress", userKey(user), ...academicScope(user)],
  adminSubjects: ["adminSubjects"],
  adminSubject: (userId, id) => ["adminSubject", userId, id],
};

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants,
    queryFn: async () => (await tenantService.getTenants()).data.tenants || [],
  });
}

export function useStudentSubjects(user, enabled = true) {
  return useQuery({
    queryKey: queryKeys.studentSubjects(user),
    queryFn: async () => (await subjectService.getSubjects()).data.subjects || [],
    enabled: Boolean(userKey(user)) && enabled,
  });
}

export function useGlobalProgress(user, enabled = true) {
  return useQuery({
    queryKey: queryKeys.globalProgress(user),
    queryFn: async () => (await progressService.getGlobalProgress()).data,
    enabled: Boolean(userKey(user)) && enabled,
  });
}

export function useAdminSubject(userId, id, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminSubject(userId, id),
    queryFn: async () => (await adminService.getSubject(id)).data.subject,
    enabled: Boolean(userId && id) && enabled,
  });
}
