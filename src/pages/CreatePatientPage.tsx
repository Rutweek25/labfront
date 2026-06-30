import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { useDoctorRequestStore } from "../store/doctorRequestStore";

export const CreatePatientPage = () => {
  const navigate = useNavigate();
  const { tests, loading, createPatientWithOrder, fetchData } = useDoctorRequestStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

  useEffect(() => {
    fetchData().catch(() => {
      // no-op
    });
  }, [fetchData]);

  const totalSelected = useMemo(() => {
    return selectedTests.reduce((sum, testId) => {
      const test = tests.find((item) => item.id === testId);
      return sum + (test ? Number(test.price) : 0);
    }, 0);
  }, [selectedTests, tests]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    if (!/^\d+$/.test(age)) {
      toast.error("Age must be numeric");
      return;
    }

    if (!selectedTests.length) {
      toast.error("Select at least one test");
      return;
    }

    try {
      await createPatientWithOrder({
        patient: {
          name,
          phone,
          age: Number(age),
          gender
        },
        testIds: selectedTests
      });

      toast.success("Patient and request created successfully");
      await fetchData();
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create patient request");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Patient + Test Request" subtitle="Create a new patient and request tests in one submission." />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-slate-300 px-4 py-2.5"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-slate-300 px-4 py-2.5"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            title="Phone number must be exactly 10 digits"
            required
          />
          <input
            type="number"
            className="rounded-xl border border-slate-300 px-4 py-2.5"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            min={0}
            step={1}
            required
          />
          <select
            className="rounded-xl border border-slate-300 px-4 py-2.5"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm text-slate-600">Select Tests</p>
            <div className="grid gap-2 md:grid-cols-3">
              {tests.map((test) => {
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
                    <span className="ml-auto text-slate-500">Rs. {Number(test.price).toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-sm text-slate-600">Total: Rs. {totalSelected.toFixed(2)}</p>
            <button
              type="submit"
              disabled={!selectedTests.length || loading}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create Patient Request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
