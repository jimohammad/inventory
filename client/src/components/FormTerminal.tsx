import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Screen = "menu" | "add" | "edit" | "search" | "view";

interface FormData {
  itemCode: string;
  name: string;
  category: string;
  purchasePrice: string;
  wholesalePrice: string;
  retailPrice: string;
  openingStock: string;
}

const CATEGORIES = ["MOTOROLA", "SAMSUNG", "REDMI", "REALME", "MEIZU", "HONOR"];

// Cursor Block Component
const CursorBlock = () => (
  <span className="text-yellow-400 animate-pulse text-3xl font-bold leading-none inline-block w-6">█</span>
);

// Crosshair Lines Component
const Crosshair = ({ top, left }: { top: number; left: number }) => (
  <>
    {/* Horizontal line */}
    <div
      className="fixed left-0 right-0 h-0.5 bg-yellow-400/60 pointer-events-none z-50 shadow-lg shadow-yellow-400/50"
      style={{ top: `${top}px` }}
    />
    {/* Vertical line */}
    <div
      className="fixed top-0 bottom-0 w-0.5 bg-yellow-400/60 pointer-events-none z-50 shadow-lg shadow-yellow-400/50"
      style={{ left: `${left}px` }}
    />
  </>
);

export function FormTerminal() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [focusedField, setFocusedField] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    itemCode: "",
    name: "",
    category: "",
    purchasePrice: "",
    wholesalePrice: "",
    retailPrice: "",
    openingStock: "",
  });
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [viewItem, setViewItem] = useState<any>(null);
  const [fieldPosition, setFieldPosition] = useState<{ top: number; left: number } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const utils = trpc.useUtils();

  const { data: items } = trpc.items.list.useQuery();
  const createItemMutation = trpc.items.create.useMutation({
    onSuccess: () => {
      setStatusMessage("✓ Item saved successfully!");
      clearForm();
      utils.items.list.invalidate();
      setTimeout(() => setStatusMessage("Ready"), 2000);
    },
    onError: (error) => {
      setStatusMessage(`✗ Error: ${error.message}`);
    },
  });

  const updateItemMutation = trpc.items.update.useMutation({
    onSuccess: () => {
      setStatusMessage("✓ Item updated successfully!");
      clearForm();
      utils.items.list.invalidate();
      setTimeout(() => setStatusMessage("Ready"), 2000);
    },
    onError: (error) => {
      setStatusMessage(`✗ Error: ${error.message}`);
    },
  });

  const deleteItemMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("✓ Item deleted successfully!");
      setScreen("menu");
      utils.items.list.invalidate();
      setTimeout(() => setStatusMessage("Ready"), 2000);
    },
    onError: (error) => {
      setStatusMessage(`✗ Error: ${error.message}`);
    },
  });

  useEffect(() => {
    // Focus first field and initialize crosshair when screen changes
    if (inputRefs.current[0] && screen !== "menu" && screen !== "search") {
      setFocusedField(0);
      setTimeout(() => {
        const firstInput = inputRefs.current[0];
        if (firstInput) {
          firstInput.focus();
          updateCrosshairPosition(firstInput);
        }
      }, 100);
    }
  }, [screen]);

  const clearForm = () => {
    setFormData({
      itemCode: "",
      name: "",
      category: "",
      purchasePrice: "",
      wholesalePrice: "",
      retailPrice: "",
      openingStock: "",
    });
    setFocusedField(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldCount: number) => {
    // TAB navigation
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab - go back
        setFocusedField((prev) => (prev > 0 ? prev - 1 : fieldCount - 1));
      } else {
        // Tab - go forward
        setFocusedField((prev) => (prev < fieldCount - 1 ? prev + 1 : 0));
      }
    }

    // Function keys
    if (e.key === "F1") {
      e.preventDefault();
      showHelp();
    } else if (e.key === "F2") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "F3") {
      e.preventDefault();
      handleClear();
    } else if (e.key === "F4") {
      e.preventDefault();
      setScreen("search");
    } else if (e.key === "F6" && screen === "view") {
      e.preventDefault();
      handleDelete();
    } else if (e.key === "F10") {
      e.preventDefault();
      setScreen("menu");
      clearForm();
    }

    // Arrow keys for search results
    if (screen === "search" && searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedItemIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedItemIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
      } else if (e.key === "Enter" && searchResults[selectedItemIndex]) {
        e.preventDefault();
        handleViewItem(searchResults[selectedItemIndex]);
      }
    }
  };

  const updateCrosshairPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setFieldPosition({
      top: rect.top + rect.height / 2,
      left: rect.left + rect.width / 2,
    });
  };

  useEffect(() => {
    const currentInput = inputRefs.current[focusedField];
    currentInput?.focus();
    
    // Update crosshair position with a small delay to ensure element is rendered
    if (currentInput) {
      setTimeout(() => {
        updateCrosshairPosition(currentInput);
      }, 50);
    }
  }, [focusedField, screen]);

  const showHelp = () => {
    setStatusMessage(
      "F1=Help F2=Save F3=Clear F4=Search F6=Delete F10=Menu | TAB=Next Field SHIFT+TAB=Previous"
    );
    setTimeout(() => setStatusMessage("Ready"), 5000);
  };

  const handleSave = () => {
    if (screen === "add") {
      if (!formData.itemCode || !formData.name) {
        setStatusMessage("✗ Item Code and Name are required!");
        return;
      }

      createItemMutation.mutate({
        itemCode: formData.itemCode,
        name: formData.name,
        category: formData.category || null,
        purchasePrice: formData.purchasePrice
          ? parseFloat(formData.purchasePrice)
          : null,
        wholesalePrice: formData.wholesalePrice
          ? parseFloat(formData.wholesalePrice)
          : null,
        retailPrice: formData.retailPrice
          ? parseFloat(formData.retailPrice)
          : null,
        openingStock: formData.openingStock
          ? parseInt(formData.openingStock)
          : 0,
        availableQty: formData.openingStock
          ? parseInt(formData.openingStock)
          : 0,
      });
    } else if (screen === "edit" && viewItem) {
      updateItemMutation.mutate({
        id: viewItem.id,
        itemCode: formData.itemCode,
        name: formData.name,
        category: formData.category || null,
        purchasePrice: formData.purchasePrice
          ? parseFloat(formData.purchasePrice)
          : null,
        wholesalePrice: formData.wholesalePrice
          ? parseFloat(formData.wholesalePrice)
          : null,
        retailPrice: formData.retailPrice
          ? parseFloat(formData.retailPrice)
          : null,
        availableQty: viewItem.availableQty,
      });
    }
  };

  const handleClear = () => {
    clearForm();
    setStatusMessage("Form cleared");
    setTimeout(() => setStatusMessage("Ready"), 1000);
  };

  const handleDelete = () => {
    if (viewItem && confirm(`Delete item ${viewItem.itemCode}?`)) {
      deleteItemMutation.mutate(viewItem.id);
    }
  };

  const handleSearch = (keyword: string) => {
    if (!items) return;

    const results = items.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(keyword.toLowerCase())
    );

    setSearchResults(results);
    setSelectedItemIndex(0);
    setStatusMessage(`Found ${results.length} item(s)`);
  };

  const handleViewItem = (item: any) => {
    setViewItem(item);
    setFormData({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category || "",
      purchasePrice: item.purchasePrice?.toString() || "",
      wholesalePrice: item.wholesalePrice?.toString() || "",
      retailPrice: item.retailPrice?.toString() || "",
      openingStock: item.openingStock?.toString() || "",
    });
    setScreen("view");
  };

  const handleEditFromView = () => {
    setScreen("edit");
    setFocusedField(0);
  };

  // Menu Screen
  if (screen === "menu") {
    return (
      <div className="h-screen w-full bg-black text-green-400 font-mono flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <div className="border-2 border-green-600 p-8">
              <div className="text-center mb-8">
                <div className="text-2xl mb-2">╔═══════════════════════════════════════════╗</div>
                <div className="text-2xl mb-2">║   INVENTORY MANAGEMENT SYSTEM v2.0       ║</div>
                <div className="text-2xl mb-2">║   Form-Based Terminal Interface           ║</div>
                <div className="text-2xl">╚═══════════════════════════════════════════╝</div>
              </div>

              <div className="space-y-4 mt-12">
                <button
                  onClick={() => {
                    setScreen("add");
                    clearForm();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-green-900 hover:text-white transition-colors border border-green-700"
                >
                  <span className="text-yellow-400">[1]</span> ADD NEW ITEM
                </button>
                <button
                  onClick={() => setScreen("search")}
                  className="w-full text-left px-4 py-3 hover:bg-green-900 hover:text-white transition-colors border border-green-700"
                >
                  <span className="text-yellow-400">[2]</span> SEARCH / EDIT ITEMS
                </button>
                <button
                  onClick={() => {
                    if (items && items.length > 0) {
                      setSearchResults(items);
                      setScreen("search");
                    }
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-green-900 hover:text-white transition-colors border border-green-700"
                >
                  <span className="text-yellow-400">[3]</span> LIST ALL ITEMS
                </button>
              </div>

              <div className="mt-12 text-center text-sm">
                <div>Press number key or click to select</div>
                <div className="text-yellow-400 mt-2">
                  Total Items: {items?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-900 text-green-200 px-4 py-1 text-sm">
          F4=Search | ESC=Exit | {new Date().toLocaleString()}
        </div>
      </div>
    );
  }

  // Add Item Screen
  if (screen === "add") {
    return (
      <div
        className="h-screen w-full bg-black text-green-400 font-mono flex flex-col"
        onKeyDown={(e) => handleKeyDown(e, 7)}
      >
        {/* Crosshair lines */}
        {fieldPosition && <Crosshair top={fieldPosition.top} left={fieldPosition.left} />}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="border-2 border-green-600 p-6">
              <div className="text-center text-xl mb-6 border-b border-green-700 pb-4">
                ║ INVENTORY SYSTEM - ADD NEW ITEM ║
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 0 && <CursorBlock />}
                    Item Code:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[0] = el)}
                    type="text"
                    value={formData.itemCode}
                    onChange={(e) =>
                      setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })
                    }
                    onFocus={(e) => {
                      setFocusedField(0);
                      updateCrosshairPosition(e.target);
                    }}
                    className={`col-span-2 bg-black border ${
                      focusedField === 0 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none uppercase`}
                    placeholder="*Required"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 1 && <CursorBlock />}
                    Item Name:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[1] = el)}
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`col-span-2 bg-black border ${
                      focusedField === 1 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none`}
                    placeholder="*Required"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 2 && <CursorBlock />}
                    Category:
                  </label>
                  <select
                    ref={(el) => (inputRefs.current[2] = el as any)}
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className={`col-span-2 bg-black border ${
                      focusedField === 2 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none`}
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 3 && <CursorBlock />}
                    Purchase Price:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[3] = el)}
                    type="number"
                    step="0.001"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: e.target.value })
                    }
                    className={`col-span-2 bg-black border ${
                      focusedField === 3 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none`}
                    placeholder="KWD"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 4 && <CursorBlock />}
                    Wholesale Price:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[4] = el)}
                    type="number"
                    step="0.001"
                    value={formData.wholesalePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, wholesalePrice: e.target.value })
                    }
                    className={`col-span-2 bg-black border ${
                      focusedField === 4 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none`}
                    placeholder="KWD"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 5 && <CursorBlock />}
                    Retail Price:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[5] = el)}
                    type="number"
                    step="0.001"
                    value={formData.retailPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, retailPrice: e.target.value })
                    }
                    className={`col-span-2 bg-black border ${
                      focusedField === 5 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none`}
                    placeholder="KWD"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {focusedField === 6 && <CursorBlock />}
                    Opening Stock:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[6] = el)}
                    type="number"
                    value={formData.openingStock}
                    onChange={(e) =>
                      setFormData({ ...formData, openingStock: e.target.value })
                    }
                    className={`col-span-2 bg-black border ${
                      focusedField === 6 ? "border-yellow-400" : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none`}
                    placeholder="Units"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-green-700">
                <div className="text-center text-yellow-400">{statusMessage}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-900 text-green-200 px-4 py-1 text-sm">
          F1=Help | F2=Save | F3=Clear | F4=Search | F10=Menu | TAB=Next Field
        </div>
      </div>
    );
  }

  // Search Screen
  if (screen === "search") {
    return (
      <div className="h-screen w-full bg-black text-green-400 font-mono flex flex-col">
        <div className="flex-1 flex flex-col p-4">
          <div className="border-2 border-green-600 p-6 mb-4">
            <div className="text-center text-xl mb-4 border-b border-green-700 pb-4">
              ║ SEARCH ITEMS ║
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Type to search by name or code..."
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-black border border-green-700 px-4 py-2 text-green-400 focus:outline-none focus:border-yellow-400"
                autoFocus
                onKeyDown={(e) => handleKeyDown(e, 1)}
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border-2 border-green-600 p-4 flex-1 overflow-auto">
              <div className="text-sm mb-2">
                Found {searchResults.length} item(s) - Use ↑↓ arrows to navigate, ENTER to view
              </div>
              <div className="space-y-1">
                {searchResults.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-2 cursor-pointer ${
                      index === selectedItemIndex
                        ? "bg-green-900 text-white"
                        : "hover:bg-green-950"
                    }`}
                    onClick={() => handleViewItem(item)}
                  >
                    <span className="text-yellow-400">{item.itemCode}</span> -{" "}
                    {item.name} | {item.category} | Qty: {item.availableQty} | Price:{" "}
                    {item.retailPrice}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-yellow-400">{statusMessage}</div>
        </div>

        <div className="bg-green-900 text-green-200 px-4 py-1 text-sm">
          F10=Menu | ENTER=View Selected | ↑↓=Navigate
        </div>
      </div>
    );
  }

  // View/Edit Screen
  if (screen === "view" || screen === "edit") {
    const isEditMode = screen === "edit";
    const fieldCount = 7;

    return (
      <div
        className="h-screen w-full bg-black text-green-400 font-mono flex flex-col"
        onKeyDown={(e) => handleKeyDown(e, fieldCount)}
      >
        {/* Crosshair lines */}
        {isEditMode && fieldPosition && <Crosshair top={fieldPosition.top} left={fieldPosition.left} />}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="border-2 border-green-600 p-6">
              <div className="text-center text-xl mb-6 border-b border-green-700 pb-4">
                ║ {isEditMode ? "EDIT ITEM" : "VIEW ITEM DETAILS"} ║
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {isEditMode && focusedField === 0 && <CursorBlock />}
                    Item Code:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[0] = el)}
                    type="text"
                    value={formData.itemCode}
                    onChange={(e) =>
                      setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })
                    }
                    disabled={!isEditMode}
                    className={`col-span-2 bg-black border ${
                      isEditMode && focusedField === 0
                        ? "border-yellow-400"
                        : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none uppercase ${
                      !isEditMode && "opacity-70"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {isEditMode && focusedField === 1 && <CursorBlock />}
                    Item Name:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[1] = el)}
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditMode}
                    className={`col-span-2 bg-black border ${
                      isEditMode && focusedField === 1
                        ? "border-yellow-400"
                        : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none ${
                      !isEditMode && "opacity-70"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {isEditMode && focusedField === 2 && <CursorBlock />}
                    Category:
                  </label>
                  <select
                    ref={(el) => (inputRefs.current[2] = el as any)}
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    disabled={!isEditMode}
                    className={`col-span-2 bg-black border ${
                      isEditMode && focusedField === 2
                        ? "border-yellow-400"
                        : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none ${
                      !isEditMode && "opacity-70"
                    }`}
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {isEditMode && focusedField === 3 && <CursorBlock />}
                    Purchase Price:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[3] = el)}
                    type="number"
                    step="0.001"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: e.target.value })
                    }
                    disabled={!isEditMode}
                    className={`col-span-2 bg-black border ${
                      isEditMode && focusedField === 3
                        ? "border-yellow-400"
                        : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none ${
                      !isEditMode && "opacity-70"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {isEditMode && focusedField === 4 && <CursorBlock />}
                    Wholesale Price:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[4] = el)}
                    type="number"
                    step="0.001"
                    value={formData.wholesalePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, wholesalePrice: e.target.value })
                    }
                    disabled={!isEditMode}
                    className={`col-span-2 bg-black border ${
                      isEditMode && focusedField === 4
                        ? "border-yellow-400"
                        : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none ${
                      !isEditMode && "opacity-70"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    {isEditMode && focusedField === 5 && <CursorBlock />}
                    Retail Price:
                  </label>
                  <input
                    ref={(el) => (inputRefs.current[5] = el)}
                    type="number"
                    step="0.001"
                    value={formData.retailPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, retailPrice: e.target.value })
                    }
                    disabled={!isEditMode}
                    className={`col-span-2 bg-black border ${
                      isEditMode && focusedField === 5
                        ? "border-yellow-400"
                        : "border-green-700"
                    } px-3 py-2 text-green-400 focus:outline-none ${
                      !isEditMode && "opacity-70"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-right flex items-center justify-end gap-2">
                    Available Qty:
                  </label>
                  <div className="col-span-2 px-3 py-2 text-yellow-400">
                    {viewItem?.availableQty || 0} units
                  </div>
                </div>

                {!isEditMode && (
                  <>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <label className="text-right">Created:</label>
                      <div className="col-span-2 px-3 py-2 opacity-70">
                        {viewItem && new Date(viewItem.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <label className="text-right">Updated:</label>
                      <div className="col-span-2 px-3 py-2 opacity-70">
                        {viewItem && new Date(viewItem.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-green-700 flex justify-center gap-4">
                {!isEditMode && (
                  <button
                    onClick={handleEditFromView}
                    className="px-6 py-2 bg-green-900 hover:bg-green-800 border border-green-600"
                  >
                    [E] EDIT
                  </button>
                )}
                <div className="text-center text-yellow-400">{statusMessage}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-900 text-green-200 px-4 py-1 text-sm">
          {isEditMode
            ? "F1=Help | F2=Save | F3=Cancel | F10=Menu | TAB=Next Field"
            : "F6=Delete | F10=Menu | E=Edit"}
        </div>
      </div>
    );
  }

  return null;
}
