import { useEffect, useMemo, useState, useCallback } from "react";
import { ShipmentAPI } from "./api";

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Box,
  Stack,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RefreshIcon from "@mui/icons-material/Refresh";

const STATUS = ["CREATED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

const emptyForm = {
  trackingNumber: "",
  senderName: "",
  receiverName: "",
  pickupCity: "",
  dropCity: "",
  status: "CREATED",
  vehicleNumber: "",
  expectedDeliveryDate: "", // "YYYY-MM-DD"
};

function statusChipProps(status) {
  // No custom colors asked; MUI default palette looks professional.
  switch (status) {
    case "DELIVERED":
      return { color: "success", variant: "filled" };
    case "IN_TRANSIT":
      return { color: "info", variant: "filled" };
    case "CANCELLED":
      return { color: "error", variant: "filled" };
    default:
      return { color: "default", variant: "outlined" };
  }
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // dialog
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const notify = useCallback((msg, severity = "success") => setSnack({ open: true, msg, severity }), []);
  const closeSnack = useCallback(() => setSnack((s) => ({ ...s, open: false })), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ShipmentAPI.list();
      setRows(res.data || []);
    } catch (e) {
      notify("Failed to load shipments. Check backend is running on :8080", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => (statusFilter === "ALL" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!q) return true;
        const hay = [
          r.trackingNumber,
          r.senderName,
          r.receiverName,
          r.pickupCity,
          r.dropCity,
          r.vehicleNumber,
          r.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const counts = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    return { total, counts };
  }, [rows]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      trackingNumber: row.trackingNumber || "",
      senderName: row.senderName || "",
      receiverName: row.receiverName || "",
      pickupCity: row.pickupCity || "",
      dropCity: row.dropCity || "",
      status: row.status || "CREATED",
      vehicleNumber: row.vehicleNumber || "",
      expectedDeliveryDate: row.expectedDeliveryDate || "",
    });
    setOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setOpen(false);
  };

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const validate = () => {
    if (!form.trackingNumber.trim()) return "Tracking Number is required";
    if (!form.pickupCity.trim()) return "Pickup City is required";
    if (!form.dropCity.trim()) return "Drop City is required";
    if (!form.status.trim()) return "Status is required";
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return notify(err, "error");

    try {
      setSaving(true);
      const payload = {
        trackingNumber: form.trackingNumber.trim(),
        senderName: form.senderName.trim(),
        receiverName: form.receiverName.trim(),
        pickupCity: form.pickupCity.trim(),
        dropCity: form.dropCity.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
        status: form.status,
        expectedDeliveryDate: form.expectedDeliveryDate,
      };

      if (editId) {
        await ShipmentAPI.update(editId, payload);
        notify("Shipment updated");
      } else {
        await ShipmentAPI.create(payload);
        notify("Shipment created");
      }

      setOpen(false);
      await load();
    } catch (e) {
      // Error from backend (e.g., validation, uniqueness, etc.)
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message || "Save failed. Please check the data and try again.";
      notify(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const ok = window.confirm("Delete this shipment?");
    if (!ok) return;

    try {
      await ShipmentAPI.remove(id);
      notify("Shipment deleted");
      await load();
    } catch (e) {
      notify("Delete failed", "error");
    }
  };

  const quickTrackingSearch = async () => {
    const t = search.trim();
    if (!t) return notify("Type a tracking number in search box", "info");
    try {
      setLoading(true);
      const res = await ShipmentAPI.getByTracking(t);
      setRows(res.data ? [res.data] : []);
      notify("Found by tracking number");
    } catch {
      notify("No shipment found for this tracking number", "warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <LocalShippingIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Smart Logistics Transport System
          </Typography>

          <Tooltip title="Refresh">
            <IconButton color="inherit" onClick={load}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button color="inherit" startIcon={<AddIcon />} onClick={openCreate}>
            New Shipment
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Top cards */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="overline">Total Shipments</Typography>
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              Stored in H2 (in-memory). Restart backend = data resets.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: 2 }}>
            <Typography variant="overline">Status Overview</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {STATUS.map((s) => (
                <Chip
                  key={s}
                  label={`${s} • ${stats.counts[s] || 0}`}
                  {...statusChipProps(s)}
                  onClick={() => setStatusFilter(s)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
              <Chip
                label="ALL"
                variant={statusFilter === "ALL" ? "filled" : "outlined"}
                onClick={() => setStatusFilter("ALL")}
                sx={{ cursor: "pointer" }}
              />
            </Stack>
          </Paper>
        </Stack>

        {/* Search + filters */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <TextField
                fullWidth
              label="Search (tracking, city, sender, vehicle, status...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="outlined" onClick={quickTrackingSearch}>
              Search Tracking
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ whiteSpace: "nowrap" }}
            >
              Create
            </Button>
          </Stack>
        </Paper>

        {/* Table */}
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6">Shipments</Typography>
            <Typography variant="body2" color="text.secondary">
              Showing {filtered.length} of {rows.length}
            </Typography>
          </Box>

          <Divider />

          {loading ? (
            <Box sx={{ p: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tracking</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>EDD</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography sx={{ py: 3 }} color="text.secondary" align="center">
                          No shipments found. Create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.trackingNumber}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.status} {...statusChipProps(r.status)} />
                        </TableCell>
                        <TableCell>
                          {r.pickupCity} → {r.dropCity}
                        </TableCell>
                        <TableCell>{r.vehicleNumber || "-"}</TableCell>
                        <TableCell>{r.expectedDeliveryDate || "-"}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton onClick={() => openEdit(r)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => remove(r.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{editId ? "Edit Shipment" : "Create Shipment"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Tracking Number *"
                value={form.trackingNumber}
                onChange={handleChange("trackingNumber")}
              />
              <TextField
                fullWidth
                label="Vehicle Number"
                value={form.vehicleNumber}
                onChange={handleChange("vehicleNumber")}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Sender Name"
                value={form.senderName}
                onChange={handleChange("senderName")}
              />
              <TextField
                fullWidth
                label="Receiver Name"
                value={form.receiverName}
                onChange={handleChange("receiverName")}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                 fullWidth
                label="Pickup City *"
                value={form.pickupCity}
                onChange={handleChange("pickupCity")}
              />
              <TextField
                fullWidth
                label="Drop City *"
                value={form.dropCity}
                onChange={handleChange("dropCity")}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Status *"
                select
                SelectProps={{ native: true }}
                value={form.status}
                onChange={handleChange("status")}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Expected Delivery Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.expectedDeliveryDate}
                onChange={handleChange("expectedDeliveryDate")}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Note: All fields with * are required.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Saving..." : editId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
// test change