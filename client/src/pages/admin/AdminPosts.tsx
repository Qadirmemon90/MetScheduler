/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  PlayIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get("/api/admin/posts", { params });
      setPosts(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const handlePublishNow = async (postId: string) => {
    if (!window.confirm("Publish this post to connected platforms immediately?")) return;
    setActionLoading(true);
    try {
      await api.post(`/api/admin/posts/${postId}/publish-now`);
      toast.success("Post successfully published!");
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to publish post");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/api/admin/posts/${postId}`);
      toast.success("Post deleted.");
      await fetchPosts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete post");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarClockIcon className="size-5 text-red-500" />
            Social Media Posts & Scheduler Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor all scheduled, published, and failed posts across all users. Trigger manual
            instant publishing or delete problematic posts.
          </p>
        </div>

        <button
          onClick={fetchPosts}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto border border-slate-700"
        >
          <RefreshCwIcon className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All Posts" },
            { id: "scheduled", label: "Scheduled Queue" },
            { id: "published", label: "Published" },
            { id: "failed", label: "Failed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPosts();
          }}
          className="flex items-center gap-2 w-full md:w-80"
        >
          <div className="relative flex-1">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search post text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Posts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <CalendarClockIcon className="size-10 text-slate-700 mx-auto mb-3" />
            No posts found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Content</th>
                  <th className="py-3.5 px-4 font-semibold">Platforms</th>
                  <th className="py-3.5 px-4 font-semibold">Media</th>
                  <th className="py-3.5 px-4 font-semibold">Scheduled For</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {posts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{p.user?.name || "User"}</div>
                      <div className="text-[11px] text-slate-400">{p.user?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-200">{p.content}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.platforms || []).map((plat: string) => (
                          <span
                            key={plat}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 uppercase"
                          >
                            {plat}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.mediaUrl ? (
                        <a
                          href={p.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="size-8 rounded-lg overflow-hidden border border-slate-700 block hover:opacity-80 transition"
                        >
                          <img
                            src={p.mediaUrl}
                            alt="Media"
                            className="size-full object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {p.scheduledFor ? new Date(p.scheduledFor).toLocaleString() : "-"}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.status === "scheduled" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          <ClockIcon className="size-3" /> Scheduled
                        </span>
                      )}
                      {p.status === "published" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2Icon className="size-3" /> Published
                        </span>
                      )}
                      {p.status === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircleIcon className="size-3" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === "scheduled" && (
                          <button
                            type="button"
                            onClick={() => handlePublishNow(p._id)}
                            disabled={actionLoading}
                            title="Publish Immediately"
                            className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/30 rounded-lg transition"
                          >
                            <PlayIcon className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePost(p._id)}
                          title="Delete Post"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
