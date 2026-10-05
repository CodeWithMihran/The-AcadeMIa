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

const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold focus:border-blue-500 focus:outline-none";

export const AddSubject = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allTenants = [], isLoading: tenantsLoading, error: tenantsError } = useTenants();
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

  return <div className="min-h-screen bg-[#fbfbfa] px-6 pb-20 pt-32 animate-in fade-in duration-500"><div className="mx-auto max-w-5xl">
    <header className="mb-10 border-b border-gray-200 pb-8"><Link to="/admin" className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black"><ArrowLeft className="h-3.5 w-3.5"/>Back to Console</Link><h1 className="text-4xl font-black italic tracking-tighter">Create <span className="font-light not-italic text-gray-400">New Subject</span></h1><p className="mt-2 font-medium text-gray-500">Define the curriculum and career preparation materials.</p></header>
    {error && <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600"><AlertTriangle className="h-5 w-5"/>{error}</div>}
    {success && <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-600"><CheckCircle2 className="h-5 w-5"/>{success}</div>}
    <FormProvider {...methods}><form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div role="tablist" aria-label="Subject data" className="flex gap-2 rounded-2xl bg-gray-100 p-2">{[["syllabus", "University Syllabus"], ["career", "Career Bridge"]].map(([tab, label]) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-5 py-3 text-sm font-bold ${activeTab === tab ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}>{label}</button>)}</div>
      {activeTab === "syllabus" ? <div className="space-y-8">
        <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm"><h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Subject Parameters</h2><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-bold text-gray-700">University<select {...register("tenantId")} disabled={tenantsLoading || !tenants.length} className={`${inputClass} mt-2`}><option value="">{tenantsLoading ? "Loading..." : "Select university"}</option>{tenants.map((tenant) => <option key={tenant._id} value={tenant._id}>{tenant.name} ({tenant.shortCode})</option>)}</select>{errors.tenantId && <span className="text-red-600">{errors.tenantId.message}</span>}</label>
          <label className="text-xs font-bold text-gray-700">Subject Name<input {...register("name")} placeholder="e.g. Discrete Structures" className={`${inputClass} mt-2`} />{errors.name && <span className="text-red-600">{errors.name.message}</span>}</label>
          <label className="text-xs font-bold text-gray-700">Course Code<input {...register("courseCode")} placeholder="e.g. BCS-101" className={`${inputClass} mt-2`} /></label>
          <label className="text-xs font-bold text-gray-700">Branch<input {...register("branch")} placeholder="e.g. CSE" className={`${inputClass} mt-2 uppercase`} />{errors.branch && <span className="text-red-600">{errors.branch.message}</span>}</label>
          <label className="text-xs font-bold text-gray-700">Semester<input {...register("semester")} type="number" min="1" max="8" className={`${inputClass} mt-2`} />{errors.semester && <span className="text-red-600">{errors.semester.message}</span>}</label>
          <label className="text-xs font-bold text-gray-700">Official Course Credits<input {...register("credits")} type="number" min="0.1" max="100" step="0.1" placeholder="e.g. 4" className={`${inputClass} mt-2`} />{errors.credits && <span className="text-red-600">{errors.credits.message}</span>}</label>
        </div></section>
        <div className="flex items-center gap-4"><h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Curriculum Units</h2><div className="h-px flex-grow bg-gray-200"/></div>
        <div className="space-y-8">{fields.map((field, index) => <SubjectUnitEditor key={field.id} index={index} removable={fields.length > 1} onRemove={() => remove(index)} />)}</div>
        <button type="button" onClick={() => append(blankSubjectUnit({ unitNumber: fields.length + 1 }))} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-8 py-4 font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500 md:w-auto"><Plus className="h-4 w-4"/>Append New Unit</button>
      </div> : <Controller name="careerBridge" control={control} render={({ field }) => <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-8"><CareerBridgeEditor value={field.value} onChange={field.onChange}/></section>} />}
      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm font-semibold text-red-600">Please correct the highlighted fields before submitting.</p>}
      <div className="flex justify-end"><button type="submit" disabled={isSubmitting || createMutation.isPending || tenantsLoading || !tenants.length} className="w-full rounded-2xl bg-black px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition hover:bg-blue-600 disabled:opacity-50 md:w-auto">{isSubmitting || createMutation.isPending ? "Creating Subject..." : "Finalize & Create Subject"}</button></div>
      <input type="hidden" {...register("track")} />
    </form></FormProvider>
  </div></div>;
};
