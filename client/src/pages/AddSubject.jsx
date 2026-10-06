import { useEffect, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRACKS } from "../constants";
import { adminService } from "../services/api";
import { useTenants, queryKeys } from "../hooks/useAcademiaQueries";
import CareerBridgeEditor from "../components/CareerBridgeEditor";
import SubjectUnitEditor from "../components/SubjectUnitEditor";
import { prepareCareerBridge } from "../utils/careerBridge";
import { prepareExamNightUnit } from "../utils/examNight";
import { blankSubjectUnit, emptySubjectEditorValues, subjectEditorSchema } from "../utils/subjectForm";

const inputClass = "min-h-11 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-content focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export const AddSubject = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allTenants = [], isLoading: tenantsLoading, error: tenantsError, refetch: refetchTenants } = useTenants();
  const tenants = allTenants.filter((tenant) => tenant.type === TRACKS.UNIVERSITY);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("syllabus");
  const methods = useForm({ resolver: zodResolver(subjectEditorSchema), defaultValues: emptySubjectEditorValues(), mode: "onBlur" });
  const { control, register, handleSubmit, setValue, formState: { errors, isSubmitting } } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: "units" });
  const createMutation = useMutation({ mutationFn: adminService.createSubject });

  useEffect(() => {
    if (!methods.getValues("tenantId") && tenants.length) setValue("tenantId", tenants[0]._id, { shouldValidate: true });
  }, [methods, setValue, tenants]);

  useEffect(() => {
    if (tenantsError) setError(tenantsError.response?.data?.message || "Failed to load universities.");
  }, [tenantsError]);

  const onSubmit = async (values) => {
    setError(""); setSuccess("");
    try {
      const { examCategory: _examCategory, ...formValues } = values;
      const payload = {
        ...formValues,
        careerBridge: prepareCareerBridge(values.careerBridge),
        track: TRACKS.UNIVERSITY,
        semester: Number(values.semester),
        units: values.units.map((unit, index) => ({
          ...unit,
          unitNumber: index + 1,
          ...prepareExamNightUnit(unit),
          topics: typeof unit.topics === "string" ? unit.topics.split(",").map((title) => ({ title: title.trim() })).filter((topic) => topic.title) : unit.topics,
        })),
      };
      const response = await createMutation.mutateAsync(payload);
      if (response.data.success) {
        setSuccess("Subject created successfully!");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.adminSubjects }),
          queryClient.invalidateQueries({ queryKey: ["studentSubjects"] }),
        ]);
        setTimeout(() => navigate("/admin"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create subject.");
    }
  };

  return <main className="min-h-screen bg-app px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
    <header className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7"><Link to="/admin" className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-content-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><ArrowLeft className="h-3.5 w-3.5"/>Back to admin</Link><h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl">Create subject</h1><p className="mt-2 text-sm text-content-muted">Add university syllabus details, unit resources, exam revision, and career preparation content.</p></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800"><span className="inline-flex items-center gap-2"><AlertTriangle className="h-5 w-5 shrink-0"/>{error}</span>{tenantsError && <button type="button" onClick={() => refetchTenants()} className="min-h-10 rounded-xl bg-surface px-4 py-2 text-xs font-bold text-content">Retry universities</button>}</div>}
    {success && <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5"/>{success}</div>}
    <FormProvider {...methods}><form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div role="group" aria-label="Subject editing sections" className="flex gap-2 rounded-2xl border border-line bg-surface p-2">{[["syllabus", "University Syllabus"], ["career", "Career Bridge"]].map(([tab, label]) => <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={`min-h-11 flex-1 rounded-xl px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === tab ? "bg-surface-muted text-blue-700 shadow-sm" : "text-content-muted hover:bg-surface-muted"}`}>{label}</button>)}</div>
      {activeTab === "syllabus" ? <div className="space-y-8">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7"><h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-content-faint">Subject details</h2><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-bold text-content-secondary">University<select {...register("tenantId")} disabled={tenantsLoading || !tenants.length} className={`${inputClass} mt-2`}><option value="">{tenantsLoading ? "Loading..." : "Select university"}</option>{tenants.map((tenant) => <option key={tenant._id} value={tenant._id}>{tenant.name} ({tenant.shortCode})</option>)}</select>{errors.tenantId && <span className="text-red-600">{errors.tenantId.message}</span>}</label>
          <label className="text-xs font-bold text-content-secondary">Subject Name<input {...register("name")} placeholder="e.g. Discrete Structures" className={`${inputClass} mt-2`} />{errors.name && <span className="text-red-600">{errors.name.message}</span>}</label>
          <label className="text-xs font-bold text-content-secondary">Course Code<input {...register("courseCode")} placeholder="e.g. BCS-101" className={`${inputClass} mt-2`} /></label>
          <label className="text-xs font-bold text-content-secondary">Branch<input {...register("branch")} placeholder="e.g. CSE" className={`${inputClass} mt-2 uppercase`} />{errors.branch && <span className="text-red-600">{errors.branch.message}</span>}</label>
          <label className="text-xs font-bold text-content-secondary">Semester<input {...register("semester")} type="number" min="1" max="8" className={`${inputClass} mt-2`} />{errors.semester && <span className="text-red-600">{errors.semester.message}</span>}</label>
          <label className="text-xs font-bold text-content-secondary">Official Course Credits<input {...register("credits")} type="number" min="0.1" max="100" step="0.1" placeholder="e.g. 4" className={`${inputClass} mt-2`} />{errors.credits && <span className="text-red-600">{errors.credits.message}</span>}</label>
        </div></section>
        <div className="flex items-center gap-4"><h2 className="text-[10px] font-black uppercase tracking-widest text-content-faint">Curriculum Units</h2><div className="h-px flex-grow bg-surface-hover"/></div>
        <div className="space-y-4">{fields.map((field, index) => <SubjectUnitEditor key={field.id} index={index} removable={fields.length > 1} onRemove={() => remove(index)} />)}</div>
        <button type="button" onClick={() => append(blankSubjectUnit({ unitNumber: fields.length + 1 }))} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface px-5 py-3 font-bold text-content-secondary hover:border-blue-500 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-auto"><Plus className="h-4 w-4"/>Add unit</button>
      </div> : <Controller name="careerBridge" control={control} render={({ field }) => <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7"><CareerBridgeEditor value={field.value} onChange={field.onChange}/></section>} />}
      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm font-semibold text-red-600">Please correct the highlighted fields before submitting.</p>}
      <div className="flex justify-end"><button type="submit" disabled={isSubmitting || createMutation.isPending || tenantsLoading || !tenants.length} className="min-h-12 w-full rounded-xl bg-surface-inverse px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto">{isSubmitting || createMutation.isPending ? "Creating subject…" : "Create subject"}</button></div>
      <input type="hidden" {...register("track")} />
    </form></FormProvider>
  </div></main>;
};
