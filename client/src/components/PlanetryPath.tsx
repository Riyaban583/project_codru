import React, { useState, useEffect, useRef } from "react";
import Xarrow, { Xwrapper } from "react-xarrows";

// Child Components (Assuming you have these in the same folder)
import DraggableBox from "./DraggableBox";
import PlanetryAnimatedBackground from "./PlanetryAnimatedBackground";
import TaskModal from "./TaskModal";

// --- Types ---
interface Task {
  week: number;
  question: string;
  answer: string;
  link: string;
}

interface Position {
  x: number;
  y: number;
}

const PlanetryPath = () => {
  const xIncrement = 220;
  const containerHeight = window.innerHeight - 200;

  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalQuestion, setModalQuestion] = useState("");
  const [modalAnswer, setModalAnswer] = useState("");
  const [modalLink, setModalLink] = useState("");
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const username = localStorage.getItem("Username");

  const generateRandomYPosition = () => {
    const minY = 50;
    const maxY = containerHeight - 450;
    return Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  };

  const fetchTasks = async (user: string) => {
    try {
      // FIXED: Using dynamic environment variable instead of hardcoded URL
      const response = await fetch(`${import.meta.env.VITE_API}get-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tasks");
      }

      return await response.json();
    } catch (err) {
      console.error("Error fetching tasks:", err);
      throw err;
    }
  };

  useEffect(() => {
    const loadTasks = async () => {
      if (!username) {
        setError("User not logged in.");
        return;
      }

      try {
        const fetchedTasks: Task[] = await fetchTasks(username);
        setTasks(fetchedTasks);

        // Generate dynamic positions based on fetched tasks
        const defaultPositions = fetchedTasks.reduce((acc, task, index) => {
          const x = 50 + index * xIncrement;
          const y = generateRandomYPosition();
          acc[`task${task.week}`] = { x, y };
          return acc;
        }, {} as Record<string, Position>);

        setPositions(defaultPositions);
      } catch (err: any) {
        setError(err.message);
      }
    };

    loadTasks();
  }, [username]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    const newY = Math.min(Math.max(y, 50), containerHeight - 50);
    setPositions((prev) => ({ ...prev, [id]: { x, y: newY } }));
  };

  const handleElementClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const { x, y, width, height } = target.getBoundingClientRect();
    
    const modalWidth = 300;
    const modalHeight = 200;

    const modalX = x + window.scrollX + width / 2;
    const modalY = y + window.scrollY + height / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = modalX;
    let adjustedY = modalY;

    if (modalX + modalWidth / 2 > viewportWidth) adjustedX = viewportWidth - modalWidth / 2;
    else if (modalX - modalWidth / 2 < 0) adjustedX = modalWidth / 2;

    if (modalY + modalHeight / 2 > viewportHeight) adjustedY = viewportHeight - modalHeight / 2;
    else if (modalY - modalHeight / 2 < 0) adjustedY = modalHeight / 2;

    const clickedElementData = tasks.find((task) => `task${task.week}` === id);

    if (clickedElementData) {
      setModalQuestion(clickedElementData.question);
      setModalAnswer(clickedElementData.answer);
      setModalLink(clickedElementData.link);
      setModalPosition({ x: adjustedX, y: adjustedY });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleWheel = (event: WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += event.deltaY;
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("wheel", handleWheel);
      return () => scrollContainer.removeEventListener("wheel", handleWheel);
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 font-bold">
          Error loading path: {error}
        </div>
      </div>
    );
  }

  return (
    // Note: I left the CSS classes here because react-xarrows usually relies on 
    // highly specific positioning that your PlanetryPath.css is likely handling.
    <div className="planetry-scroll-container h-full w-full overflow-x-auto relative" ref={scrollContainerRef}>
      <div className="planetry-scroll-content relative min-w-max h-full">
        <Xwrapper>
          {tasks.map((task) => {
            const taskId = `task${task.week}`;
            return (
              <DraggableBox
                key={taskId}
                id={taskId}
                onDrag={(x: number, y: number) => handlePositionChange(taskId, x, y)}
                onClick={(e: React.MouseEvent) => handleElementClick(taskId, e)}
                className="planetry-element absolute cursor-pointer"
                style={{
                  left: positions[taskId]?.x,
                  top: positions[taskId]?.y,
                }}
              />
            );
          })}

          {tasks.slice(1).map((task, index) => (
            <Xarrow
              key={`arrow-task${task.week}`}
              start={`task${tasks[index].week}`}
              end={`task${task.week}`}
              curveness={1.5}
              color="#ed7f23" // CuTe Learning Orange for the arrows!
              strokeWidth={3}
            />
          ))}
        </Xwrapper>

        <TaskModal
          show={showModal}
          onClose={handleCloseModal}
          question={modalQuestion}
          answer={modalAnswer}
          link={modalLink}
          position={modalPosition}
        />
        <PlanetryAnimatedBackground />
      </div>
    </div>
  );
};

export default PlanetryPath;