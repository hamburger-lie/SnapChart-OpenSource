/**
 * UI 状态 Slice
 * 管理编辑模式、面板折叠状态、上传状态等 UI 层关注点
 */

import type { StateCreator } from "zustand";
import type { AppStatus } from "../../types/chart";
import type { RightPanelTab, EditableElement } from "../../types/editor";

export interface UISlice {
  // 编辑模式
  isEditMode: boolean;
  toggleEditMode: () => void;

  // 选中的可编辑元素
  selectedElement: EditableElement;
  setSelectedElement: (el: EditableElement) => void;

  // 右侧面板激活 Tab
  activeRightPanel: RightPanelTab;
  setActiveRightPanel: (panel: RightPanelTab) => void;

  // 面板折叠状态
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // 应用状态
  appStatus: AppStatus;
  errorMessage: string;
  setAppStatus: (status: AppStatus, error?: string) => void;

  // 重置所有状态
  resetAll: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isEditMode: false,
  toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),

  selectedElement: null,
  setSelectedElement: (selectedElement) => set({ selectedElement }),

  activeRightPanel: "data",
  setActiveRightPanel: (activeRightPanel) => set({ activeRightPanel }),

  // 默认展开
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),

  appStatus: "idle",
  errorMessage: "",
  setAppStatus: (appStatus, error) =>
    set({ appStatus, errorMessage: error || "" }),

  resetAll: () =>
    set({
      appStatus: "idle",
      errorMessage: "",
      isEditMode: false,
      selectedElement: null,
      activeRightPanel: "data",
      labels: [],
      datasets: [],
      title: "数据概览",
      subtitle: "",
      chartType: "bar",
    } as Partial<UISlice>),
});
