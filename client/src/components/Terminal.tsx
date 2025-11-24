import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
}

export function Terminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const { data: items } = trpc.items.list.useQuery();
  const createItemMutation = trpc.items.create.useMutation();
  const updateItemMutation = trpc.items.update.useMutation();
  const deleteItemMutation = trpc.items.delete.useMutation();

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();

    // Show welcome message
    addOutput("", `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        INVENTORY MANAGEMENT SYSTEM v1.0                        ║
║        Terminal Interface                                      ║
║                                                                ║
║        Type 'HELP' for available commands                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }, []);

  useEffect(() => {
    // Scroll to bottom when history updates
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const addOutput = (command: string, output: string) => {
    setHistory((prev) => [
      ...prev,
      {
        command,
        output,
        timestamp: new Date(),
      },
    ]);
  };

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim().toUpperCase();
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toUpperCase();
    const args = parts.slice(1);

    // Add to command history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    switch (command) {
      case "HELP":
      case "H":
      case "?":
        addOutput(cmd, `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LIST [category]          - List all items or filter by category
                          Example: LIST
                          Example: LIST SAMSUNG

SEARCH <keyword>         - Search items by name or code
                          Example: SEARCH PHONE
                          Example: SEARCH MOT001

VIEW <code>              - View detailed item information
                          Example: VIEW MOT001

ADD <code> <name> ...    - Add new item
                          Format: ADD <code> <name> <category> <purchase> <wholesale> <retail> <qty>
                          Example: ADD SAM001 "Galaxy S24" SAMSUNG 800 850 900 10

EDIT <code> <field> ...  - Edit item field
                          Example: EDIT SAM001 QTY 15
                          Example: EDIT SAM001 PRICE 950

DELETE <code>            - Delete item
                          Example: DELETE SAM001

STATS                    - Show inventory statistics

CLEAR                    - Clear screen

HELP                     - Show this help message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keyboard Shortcuts:
  ↑/↓ - Navigate command history
  TAB - Auto-complete (coming soon)
  ESC - Clear input
        `);
        break;

      case "LIST":
      case "L":
      case "LS":
        if (!items || items.length === 0) {
          addOutput(cmd, "No items found in inventory.");
          break;
        }

        const filterCategory = args[0]?.toUpperCase();
        const filteredItems = filterCategory
          ? items.filter((item) => item.category?.toUpperCase() === filterCategory)
          : items;

        if (filteredItems.length === 0) {
          addOutput(cmd, `No items found for category: ${filterCategory}`);
          break;
        }

        const listOutput = `
Found ${filteredItems.length} item(s)${filterCategory ? ` in category ${filterCategory}` : ""}:

${"CODE".padEnd(12)} ${"NAME".padEnd(30)} ${"CATEGORY".padEnd(12)} ${"QTY".padEnd(6)} ${"PRICE".padEnd(10)}
${"─".repeat(12)} ${"─".repeat(30)} ${"─".repeat(12)} ${"─".repeat(6)} ${"─".repeat(10)}
${filteredItems
  .map(
    (item) =>
      `${item.itemCode.padEnd(12)} ${item.name.substring(0, 30).padEnd(30)} ${(item.category || "N/A").padEnd(12)} ${String(item.availableQty).padEnd(6)} ${(item.retailPrice || "N/A").toString().padEnd(10)}`
  )
  .join("\n")}

Total: ${filteredItems.length} items
        `;
        addOutput(cmd, listOutput);
        break;

      case "SEARCH":
      case "S":
        if (args.length === 0) {
          addOutput(cmd, "Error: Please provide a search keyword.\nUsage: SEARCH <keyword>");
          break;
        }

        const keyword = args.join(" ").toLowerCase();
        const searchResults = items?.filter(
          (item) =>
            item.name.toLowerCase().includes(keyword) ||
            item.itemCode.toLowerCase().includes(keyword)
        );

        if (!searchResults || searchResults.length === 0) {
          addOutput(cmd, `No items found matching: ${keyword}`);
          break;
        }

        const searchOutput = `
Search results for "${keyword}": ${searchResults.length} item(s) found

${"CODE".padEnd(12)} ${"NAME".padEnd(30)} ${"CATEGORY".padEnd(12)} ${"QTY".padEnd(6)} ${"PRICE".padEnd(10)}
${"─".repeat(12)} ${"─".repeat(30)} ${"─".repeat(12)} ${"─".repeat(6)} ${"─".repeat(10)}
${searchResults
  .map(
    (item) =>
      `${item.itemCode.padEnd(12)} ${item.name.substring(0, 30).padEnd(30)} ${(item.category || "N/A").padEnd(12)} ${String(item.availableQty).padEnd(6)} ${(item.retailPrice || "N/A").toString().padEnd(10)}`
  )
  .join("\n")}
        `;
        addOutput(cmd, searchOutput);
        break;

      case "VIEW":
      case "V":
        if (args.length === 0) {
          addOutput(cmd, "Error: Please provide an item code.\nUsage: VIEW <code>");
          break;
        }

        const viewCode = args[0].toUpperCase();
        const viewItem = items?.find((item) => item.itemCode.toUpperCase() === viewCode);

        if (!viewItem) {
          addOutput(cmd, `Error: Item not found: ${viewCode}`);
          break;
        }

        const viewOutput = `
╔════════════════════════════════════════════════════════════════╗
║  ITEM DETAILS                                                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Code:            ${viewItem.itemCode.padEnd(40)}  ║
║  Name:            ${viewItem.name.substring(0, 40).padEnd(40)}  ║
║  Category:        ${(viewItem.category || "N/A").padEnd(40)}  ║
║                                                                ║
║  Purchase Price:  ${(viewItem.purchasePrice || "N/A").toString().padEnd(40)}  ║
║  Wholesale Price: ${(viewItem.wholesalePrice || "N/A").toString().padEnd(40)}  ║
║  Retail Price:    ${(viewItem.retailPrice || "N/A").toString().padEnd(40)}  ║
║                                                                ║
║  Available Qty:   ${String(viewItem.availableQty).padEnd(40)}  ║
║  Opening Stock:   ${(viewItem.openingStock || 0).toString().padEnd(40)}  ║
║                                                                ║
║  Created:         ${new Date(viewItem.createdAt).toLocaleString().padEnd(40)}  ║
║  Updated:         ${new Date(viewItem.updatedAt).toLocaleString().padEnd(40)}  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `;
        addOutput(cmd, viewOutput);
        break;

      case "STATS":
        if (!items || items.length === 0) {
          addOutput(cmd, "No items in inventory.");
          break;
        }

        const totalItems = items.length;
        const totalQty = items.reduce((sum, item) => sum + item.availableQty, 0);
        const lowStock = items.filter((item) => item.availableQty < 10).length;
        const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];

        const statsOutput = `
╔════════════════════════════════════════════════════════════════╗
║  INVENTORY STATISTICS                                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Total Items:        ${String(totalItems).padEnd(40)}  ║
║  Total Quantity:     ${String(totalQty).padEnd(40)}  ║
║  Low Stock Items:    ${String(lowStock).padEnd(40)}  ║
║  Categories:         ${String(categories.length).padEnd(40)}  ║
║                                                                ║
║  Categories: ${categories.join(", ").substring(0, 46).padEnd(46)}  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `;
        addOutput(cmd, statsOutput);
        break;

      case "CLEAR":
      case "CLS":
        setHistory([]);
        addOutput("", "Screen cleared.");
        break;

      case "ADD":
        addOutput(cmd, "ADD command not yet implemented.\nPlease use the web interface to add items.");
        break;

      case "EDIT":
        addOutput(cmd, "EDIT command not yet implemented.\nPlease use the web interface to edit items.");
        break;

      case "DELETE":
      case "DEL":
        addOutput(cmd, "DELETE command not yet implemented.\nPlease use the web interface to delete items.");
        break;

      case "":
        // Empty command, do nothing
        break;

      default:
        addOutput(
          cmd,
          `Unknown command: ${command}\nType 'HELP' for available commands.`
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "Escape") {
      setInput("");
    }
  };

  return (
    <div className="h-screen w-full bg-black text-green-400 font-mono flex flex-col overflow-hidden">
      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-gray-900"
      >
        {history.map((entry, index) => (
          <div key={index} className="space-y-1">
            {entry.command && (
              <div className="flex items-center gap-2">
                <span className="text-green-500">$</span>
                <span className="text-green-300">{entry.command}</span>
              </div>
            )}
            <pre className="whitespace-pre-wrap text-green-400 leading-relaxed">
              {entry.output}
            </pre>
          </div>
        ))}
      </div>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="border-t border-green-700 p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-xl">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-green-400 text-xl outline-none font-mono placeholder-green-700"
            placeholder="Type command..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>

      {/* Status Bar */}
      <div className="bg-green-900 text-green-200 px-4 py-1 text-sm flex justify-between">
        <span>INVENTORY TERMINAL v1.0</span>
        <span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
