import { leadStore } from "../services/lead-store.js";
import { PUGH_CRITERIA } from "../engine/pugh-matrix.js";
import { salesHandoverService } from "../services/sales-handover.service.js";

export const getLeads = (req, res) => {
  const leads = leadStore.getAllLeads();
  const stats = leadStore.getStats();
  res.json({ success: true, stats, leads });
};

export const getLeadByPhone = (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const lead = leadStore.getLead(phone);
  if (!lead) {
    return res.status(404).json({ success: false, error: "Lead not found" });
  }
  res.json({ success: true, lead });
};

export const manualSalesHandover = async (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const lead = leadStore.getLead(phone);
  if (!lead) {
    return res.status(404).json({ success: false, error: "Lead not found" });
  }

  const dossier = await salesHandoverService.triggerHandover(lead);
  res.json({ success: true, message: "Lead dispatched to sales team", dossier });
};

export const getSalesDispatches = (req, res) => {
  const dispatches = leadStore.getSalesDispatches();
  res.json({ success: true, dispatches });
};

export const deleteLead = (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const deleted = leadStore.deleteLead(phone);
  if (!deleted) {
    return res.status(404).json({ success: false, error: "Lead not found or already deleted" });
  }
  res.json({ success: true, message: `Lead data for ${phone} successfully deleted` });
};

export const getCriteriaDefinitions = (req, res) => {
  res.json({ success: true, criteria: PUGH_CRITERIA });
};


