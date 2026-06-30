import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { useAdminStore } from "../../store/adminStore";
import type { TestItem } from "../../types";

export const AdminTestsPage = () => {
  const { tests, loading, error, fetchTests, createTest, updateTest, deleteTest } = useAdminStore();
  const [editing, setEditing] = useState<TestItem | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    fetchTests().catch((err: any) => toast.error(err?.response?.data?.message || "Failed to load tests"));
  }, [fetchTests]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateTest(editing.id, { name, price: Number(price) });
        toast.success("Test updated");
      } else {
        await createTest({ name, price: Number(price) });
        toast.success("Test added");
      }
      setEditing(null);
      setName("");
      setPrice("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save test");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tests" subtitle="Create, edit, and delete laboratory tests." />
      {loading && <Loader />}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Test name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="rounded-xl border border-slate-300 px-3 py-2" type="number" min={0} step="0.01" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <div className="flex gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{editing ? "Update" : "Add"}</button>
            {editing && <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm" onClick={() => { setEditing(null); setName(""); setPrice(""); }}>Cancel</button>}
          </div>
        </div>
      </form>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500"><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Price</th><th className="py-2 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.id} className="border-b border-slate-100">
                <td className="py-3 pr-3 font-medium text-slate-900">{test.name}</td>
                <td className="py-3 pr-3">Rs. {Number(test.price).toFixed(2)}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5" onClick={() => { setEditing(test); setName(test.name); setPrice(String(test.price)); }}>Edit</button>
                    <button type="button" className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-700" onClick={() => deleteTest(test.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
