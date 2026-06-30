import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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

export const NewPatientPage = () => {
  const navigate = useNavigate();
  const {
    tests,
    loading,
    fetchData,
    createPatientWithOrder
  } = useDoctorRequestStore();

  const [newPatientForm, setNewPatientForm] = useState({ name: "", phone: "", age: "", gender: "" });
  const [newPatientTests, setNewPatientTests] = useState<number[]>([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchData().catch((err: any) => {
      toast.error(err?.response?.data?.message || "Failed to load test data");
    });
  }, [fetchData]);

  const totalSelected = useMemo(() => {
    return newPatientTests.reduce((sum, testId) => {
      const test = tests.find((item) => item.id === testId);
      return sum + (test ? Number(test.price) : 0);
    }, 0);
  }, [newPatientTests, tests]);

  const resetForm = () => {
    setNewPatientForm({ name: "", phone: "", age: "", gender: "" });
    setNewPatientTests([]);
  };

  const submitNewPatient = async (event: FormEvent) => {
    event.preventDefault();

    if (!newPatientForm.name.trim()) {
      toast.error("Patient name is required");
      return;
    }

    if (!newPatientForm.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!newPatientForm.age || Number(newPatientForm.age) <= 0) {
      toast.error("Valid age is required");
      return;
    }

    if (!newPatientForm.gender.trim()) {
      toast.error("Gender is required");
      return;
    }

    if (newPatientTests.length === 0) {
      toast.error("Select at least one test");
      return;
    }

    try {
      setIsSubmittingRequest(true);
      await createPatientWithOrder({
        patient: {
          name: newPatientForm.name,
          phone: newPatientForm.phone,
          age: Number(newPatientForm.age),
          gender: newPatientForm.gender
        },
        testIds: newPatientTests
      });

      toast.success("Patient created and request submitted successfully");
      resetForm();
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create patient request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Create Request" subtitle="Create a new patient and submit a lab request." />
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
          <p className="mt-1 text-slate-500">Create a new patient and submit a lab request.</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold text-slate-900">New Patient Request</h2>

        <form onSubmit={submitNewPatient} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Patient Name</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Enter patient name"
              value={newPatientForm.name}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Enter phone number"
              value={newPatientForm.phone}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Age</label>
            <input
              type="number"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Enter age"
              value={newPatientForm.age}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
              required
              min={1}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Gender</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
              value={newPatientForm.gender}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
              required
            >
              <option value="">Select gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Select Lab Tests</label>
            <div className="grid gap-2 md:grid-cols-3">
              {tests.map((test: TestItem) => {
                const checked = newPatientTests.includes(test.id);
                return (
                  <label key={test.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setNewPatientTests((prev) =>
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
              disabled={!newPatientTests.length || loading || isSubmittingRequest}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {isSubmittingRequest ? <Spinner /> : <PlusIcon />}
              {isSubmittingRequest ? "Creating..." : "Create Patient & Submit"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
