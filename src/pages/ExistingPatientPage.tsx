import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { Loader } from "../components/Loader";
import type { TestItem } from "../types";
import { useDoctorRequestStore } from "../store/doctorRequestStore";

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
);

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const BackArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
    <path d="M12 16l-6-6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type PatientFormState = {
  name: string;
  phone: string;
  age: string;
  gender: string;
};

export const ExistingPatientPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    patients,
    selectedPatient,
    tests,
    loading,
    setSelectedPatient,
    fetchData,
    createOrderForExisting,
    updatePatient,
    deletePatient
  } = useDoctorRequestStore();

  const [selectedPatientId, setSelectedPatientId] = useState<number | "">("");
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState<PatientFormState>({
    name: "",
    phone: "",
    age: "",
    gender: ""
  });

  useEffect(() => {
    fetchData().catch((err: any) => {
      toast.error(err?.response?.data?.message || "Failed to load patient data");
    });
  }, [fetchData]);

  useEffect(() => {
    const patientIdParam = searchParams.get("patientId");
    if (!patientIdParam) {
      return;
    }

    const patientId = Number(patientIdParam);
    if (!Number.isFinite(patientId)) {
      return;
    }

    setSelectedPatientId(patientId);
  }, [searchParams]);

  useEffect(() => {
    const selected = patients.find((patient) => patient.id === selectedPatientId) ?? null;
    setSelectedPatient(selected);
  }, [selectedPatientId, patients, setSelectedPatient]);

  useEffect(() => {
    if (selectedPatient) {
      document.getElementById("selected-patient-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (!selectedPatient) {
      setEditPatientForm({ name: "", phone: "", age: "", gender: "" });
      return;
    }

    setEditPatientForm({
      name: selectedPatient.name,
      phone: selectedPatient.phone,
      age: String(selectedPatient.age),
      gender: selectedPatient.gender
    });
  }, [selectedPatient]);

  const totalSelected = useMemo(() => {
    return selectedTests.reduce((sum, testId) => {
      const test = tests.find((item) => item.id === testId);
      return sum + (test ? Number(test.price) : 0);
    }, 0);
  }, [selectedTests, tests]);

  const resetForm = () => {
    setSelectedPatientId("");
    setSelectedPatient(null);
    setSelectedTests([]);
  };

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedPatientId) {
      toast.error("Select an existing patient");
      return;
    }

    if (selectedTests.length === 0) {
      toast.error("Select at least one test");
      return;
    }

    try {
      setIsSubmittingRequest(true);
      await createOrderForExisting({
        patientId: Number(selectedPatientId),
        testIds: selectedTests
      });

      toast.success("Request created successfully");
      resetForm();
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const openEditModal = () => {
    if (!selectedPatient) {
      toast.error("Select a patient first");
      return;
    }
    setIsEditOpen(true);
  };

  const savePatientDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPatient) return;

    const payload = {
      name: editPatientForm.name.trim(),
      phone: editPatientForm.phone.trim(),
      age: Number(editPatientForm.age),
      gender: editPatientForm.gender.trim()
    };

    if (!payload.name || !payload.phone || !payload.gender || !payload.age) {
      toast.error("All fields are required");
      return;
    }

    if (!/^\d{10}$/.test(payload.phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    if (!Number.isInteger(payload.age) || payload.age <= 0) {
      toast.error("Age must be a valid number");
      return;
    }

    try {
      setIsSavingPatient(true);
      await updatePatient(selectedPatient.id, payload);
      setSelectedPatient({ ...selectedPatient, ...payload });
      setIsEditOpen(false);
      toast.success("Patient updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update patient");
    } finally {
      setIsSavingPatient(false);
    }
  };

  const confirmDeletePatient = async () => {
    if (!selectedPatient) return;

    try {
      setIsDeletingPatient(true);
      await deletePatient(selectedPatient.id);
      toast.success("Patient deleted successfully");
      setSelectedPatient(null);
      setSelectedPatientId("");
      setSelectedTests([]);
      setIsDeleteConfirmOpen(false);
    } catch (error: any) {
      const status = error?.response?.status;
      const message = String(error?.response?.data?.message || "").toLowerCase();

      if (status === 403) {
        toast.error("You are not allowed to delete this patient");
      } else if (status === 409 || message.includes("existing requests") || message.includes("active requests")) {
        toast.error("Cannot delete patient with active requests");
      } else {
        toast.error(error?.response?.data?.message || "Failed to delete patient");
      }
    } finally {
      setIsDeletingPatient(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Create Request" subtitle="Create a new lab request for an existing patient." />
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/doctor-dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <BackArrowIcon />
          Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Request</h1>
          <p className="mt-1 text-slate-500">Create a new lab request for an existing patient.</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold text-slate-900">Existing Patient Request</h2>

        <form onSubmit={submitRequest} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Select Patient</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
              value={selectedPatientId}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setSelectedPatientId("");
                  return;
                }

                setSelectedPatientId(Number(value));
              }}
              required
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.phone})
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <>
              <div id="selected-patient-section" className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Selected Patient</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{selectedPatient.name}</p>
                <p className="text-sm text-slate-500">{selectedPatient.phone} • Age {selectedPatient.age} • {selectedPatient.gender}</p>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Name</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5"
                  value={selectedPatient.name}
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Phone</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5"
                  value={selectedPatient.phone}
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Age</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5"
                  value={selectedPatient.age}
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Gender</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5"
                  value={selectedPatient.gender}
                  readOnly
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openEditModal}
                  className="rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Edit Patient
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Delete Patient
                </button>
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Select Lab Tests</label>
            <div className="grid gap-2 md:grid-cols-3">
              {tests.map((test: TestItem) => {
                const checked = selectedTests.includes(test.id);
                return (
                  <label key={test.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedTests((prev) =>
                          checked ? prev.filter((id) => id !== test.id) : [...prev, test.id]
                        );
                      }}
                    />
                    <span className="font-medium">{test.name}</span>
                    <span className="ml-auto text-slate-500">₹ {Number(test.price).toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-700">Estimated Total: ₹ {totalSelected.toFixed(2)}</p>
            <button
              type="submit"
              disabled={!selectedTests.length || loading || isSubmittingRequest}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {isSubmittingRequest ? <Spinner /> : <PlusIcon />}
              {isSubmittingRequest ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </section>

      {isEditOpen && selectedPatient && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-semibold text-slate-900">Edit Patient Details</h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={savePatientDetails} className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="Name"
                value={editPatientForm.name}
                onChange={(e) => setEditPatientForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="Phone"
                value={editPatientForm.phone}
                onChange={(e) => setEditPatientForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <input
                type="number"
                min={1}
                className="rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="Age"
                value={editPatientForm.age}
                onChange={(e) => setEditPatientForm((prev) => ({ ...prev, age: e.target.value }))}
                required
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="Gender"
                value={editPatientForm.gender}
                onChange={(e) => setEditPatientForm((prev) => ({ ...prev, gender: e.target.value }))}
                required
              />

              <div className="md:col-span-2 mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPatient}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingPatient ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && selectedPatient && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm Delete</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to delete this patient?</p>
            <p className="mt-1 text-sm text-slate-500">{selectedPatient.name} ({selectedPatient.phone})</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePatient}
                disabled={isDeletingPatient}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeletingPatient ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
