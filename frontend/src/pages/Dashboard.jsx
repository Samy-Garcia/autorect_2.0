import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Box, Search, ShieldCheck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";

const TOKEN_KEY = "accessToken";

const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const normalizeUser = (user = {}) => ({
  id: user._id || user.id || "",
  name: user.name || "",
  lastName: user.lastName || "",
  email: user.email || "",
  createdAt: user.createdAt || null,
  isVerified: Boolean(user.isVerified),
});

const normalizeProduct = (product = {}) => ({
  id: product._id || product.id || "",
  name: product.name || "",
  description: product.description || "",
  stock: Number(product.stock || 0),
  price: Number(product.price || 0),
  createdAt: product.createdAt || null,
});

const toShortMonth = (date) =>
  date.toLocaleDateString("es-SV", {
    month: "short",
  });

function Dashboard() {
  const { API, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getStoredToken();
      if (!token) {
        await logout({ reason: "expired", callApi: false });
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [usersRes, productsRes] = await Promise.all([
        fetch(`${API}/users`, { headers, credentials: "include" }),
        fetch(`${API}/products`, { headers, credentials: "include" }),
      ]);

      if (usersRes.status === 401 || productsRes.status === 401) {
        await logout({ reason: "expired", callApi: false });
        return;
      }

      const usersPayload = await usersRes.json().catch(() => ({}));
      const productsPayload = await productsRes.json().catch(() => ({}));

      if (!usersRes.ok || !productsRes.ok) {
        throw new Error(usersPayload?.message || productsPayload?.message || "No se pudieron cargar los datos del dashboard");
      }

      const usersData = Array.isArray(usersPayload?.data)
        ? usersPayload.data.map(normalizeUser)
        : [];
      const productsData = Array.isArray(productsPayload?.data)
        ? productsPayload.data.map(normalizeProduct)
        : [];

      setUsers(usersData);
      setProducts(productsData);
    } catch (requestError) {
      setError(requestError.message || "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  }, [API, logout]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const verifiedUsers = users.filter((user) => user.isVerified).length;
  const lowStockProducts = products.filter((product) => product.stock <= 5).length;
  const avgStock = products.length
    ? Math.round(products.reduce((acc, product) => acc + product.stock, 0) / products.length)
    : 0;

  const activityRows = useMemo(() => {
    const userRows = users.map((user) => ({
      id: `U-${user.id}`,
      type: "Usuario",
      title: `${user.name} ${user.lastName}`.trim() || user.email,
      subtitle: user.email,
      createdAt: user.createdAt,
      status: user.isVerified ? "Verificado" : "Pendiente",
    }));

    const productRows = products.map((product) => ({
      id: `P-${product.id}`,
      type: "Producto",
      title: product.name,
      subtitle: product.description || "Sin descripcion",
      createdAt: product.createdAt,
      status: product.stock <= 5 ? "Stock bajo" : "Disponible",
    }));

    return [...userRows, ...productRows]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [products, users]);

  const filteredActivity = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return activityRows.slice(0, 12);
    }

    return activityRows
      .filter((row) =>
        `${row.title} ${row.subtitle} ${row.type} ${row.status}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 12);
  }, [activityRows, search]);

  const usersMonthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return months.map((monthDate) => {
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const count = users.filter((user) => {
        if (!user.createdAt) {
          return false;
        }
        const d = new Date(user.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}` === key;
      }).length;

      return {
        label: toShortMonth(monthDate),
        total: count,
      };
    });
  }, [users]);

  const topStockProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5)
        .map((product) => ({
          label: product.name.length > 12 ? `${product.name.slice(0, 12)}...` : product.name,
          stock: product.stock,
        })),
    [products],
  );

  return (
    <div className="space-y-4 pb-4">

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-[#1a1a1a] text-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-white/45">Usuarios totales</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><Users className="h-5 w-5 text-[#c65a5a]" />{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-[#1a1a1a] text-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-white/45">Usuarios verificados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-emerald-300"><ShieldCheck className="h-5 w-5" />{verifiedUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-[#1a1a1a] text-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-white/45">Productos totales</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><Box className="h-5 w-5 text-[#c65a5a]" />{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-[#1a1a1a] text-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-white/45">Stock bajo / Promedio</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl"><Activity className="h-5 w-5 text-[#c65a5a]" />{lowStockProducts} / {avgStock}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <Card className="border-white/10 bg-[#151515] text-white">
          <CardHeader>
            <CardTitle>Alta de usuarios por mes</CardTitle>
            <CardDescription className="text-white/45">Tendencia de crecimiento durante los ultimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: {
                  label: "Usuarios",
                  color: "#822727",
                },
              }}
              className="h-60 w-full"
            >
              <LineChart data={usersMonthlyTrend} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#a3a3a3", fontSize: 12 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={3} dot={{ r: 4, fill: "#822727" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#151515] text-white">
          <CardHeader>
            <CardTitle>Productos con mas stock</CardTitle>
            <CardDescription className="text-white/45">Lectura rapida de inventario actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                stock: {
                  label: "Stock",
                  color: "#c65a5a",
                },
              }}
              className="h-60 w-full"
            >
              <BarChart data={topStockProducts} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#a3a3a3", fontSize: 12 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="stock" fill="var(--color-stock)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-[#151515] text-white">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription className="text-white/45">Resultados en tiempo real desde usuarios y productos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-invisible max-h-105 overflow-y-auto rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/55">Tipo</TableHead>
                  <TableHead className="text-white/55">Nombre</TableHead>
                  <TableHead className="text-white/55">Detalle</TableHead>
                  <TableHead className="text-white/55">Estado</TableHead>
                  <TableHead className="text-right text-white/55">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="py-8 text-center text-white/55">Cargando actividad...</TableCell>
                  </TableRow>
                ) : null}

                {!loading && filteredActivity.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="py-8 text-center text-white/55">No hay resultados para la busqueda actual.</TableCell>
                  </TableRow>
                ) : null}

                {!loading && filteredActivity.map((row) => (
                  <TableRow key={row.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white/75">{row.type}</TableCell>
                    <TableCell className="font-medium text-white">{row.title}</TableCell>
                    <TableCell className="max-w-60 truncate text-white/70">{row.subtitle}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={row.status === "Verificado" || row.status === "Disponible"
                          ? "border-emerald-500/35 text-emerald-300"
                          : "border-amber-500/35 text-amber-300"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-white/70">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-SV") : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
