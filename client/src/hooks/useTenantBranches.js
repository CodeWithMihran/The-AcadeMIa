import { useCallback, useEffect, useState } from "react";
import { subjectService } from "../services/api";

export function useTenantBranches(tenantId) {
  const [result, setResult] = useState({ tenantId: "", branches: [], loading: false, error: "" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!tenantId) return undefined;
    let active = true;
    subjectService.getBranches(tenantId).then((response) => {
      if (active) setResult({ tenantId, branches: response.data.branches || [], loading: false, error: "" });
    }).catch((requestError) => {
      if (active) setResult({ tenantId, branches: [], loading: false, error: requestError.response?.data?.message || "Could not load branches for this university." });
    });
    return () => { active = false; };
  }, [tenantId, requestVersion]);

  const retry = useCallback(() => {
    setResult({ tenantId, branches: [], loading: true, error: "" });
    setRequestVersion((version) => version + 1);
  }, [tenantId]);

  const currentResult = result.tenantId === tenantId;
  return {
    branches: currentResult ? result.branches : [],
    loading: Boolean(tenantId) && (!currentResult || result.loading),
    error: currentResult ? result.error : "",
    retry,
  };
}
