import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import API from "../api/axios";
import { PageHeader } from "../components/PageHeader";

export const AddPatientPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    if (!/^\d+$/.test(age)) {
      toast.error("Age must be numeric");
      return;
    }

    setLoading(true);

    try {
      await API.post("/patients", {
        name,
        phone,
        age: Number(age),
        gender
      });
      toast.success("Patient added");
      setName("");
      setPhone("");
      setAge("");
      setGender("Male");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Patient" subtitle="Register patient details before requesting tests." />
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input className="rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
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
          className="rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          min={0}
          step={1}
          required
        />
        <select className="rounded-xl border border-slate-300 px-4 py-2.5" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
          {loading ? "Saving..." : "Save Patient"}
        </button>
      </form>
    </div>
  );
};
