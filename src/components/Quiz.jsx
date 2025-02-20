import React, { useState, useEffect } from "react";
import "../styles/Quiz.css";

const quizQuestions = [
    { question: "Which planet is closest to the Sun?", options: ["A. Venus", "B. Mercury", "C. Earth", "D. Mars"], answer: "B" },
    { question: "Which data structure organizes items in a FIFO manner?", options: ["A. Stack", "B. Queue", "C. Tree", "D. Graph"], answer: "B" },
    { question: "Which of the following is primarily used for structuring web pages?", options: ["A. Python", "B. Java", "C. HTML", "D. C++"], answer: "C" },
    { question: "Which chemical symbol stands for Gold?", options: ["A. Au", "B. Gd", "C. Ag", "D. Pt"], answer: "A" },
    { question: "Which of these processes is not typically involved in refining petroleum?", options: ["A. Fractional distillation", "B. Cracking", "C. Polymerization", "D. Filtration"], answer: "D" },
    { question: "What is the value of 12 + 28?", type: "integer", answer: 40 },
    { question: "How many states are there in the United States?", type: "integer", answer: 50 },
    { question: "In which year was the Declaration of Independence signed?", type: "integer", answer: 1776 },
    { question: "What is the value of pi rounded to the nearest integer?", type: "integer", answer: 3 },
    { question: "If a car travels at 60 mph for 2 hours, how many miles does it travel?", type: "integer", answer: 120 }
];

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("QuizHistoryDB", 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("attempts")) {
                db.createObjectStore("attempts", { autoIncrement: true });
            }
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
};

const saveAttempt = async (attempt) => {
    const db = await openDB();
    const transaction = db.transaction("attempts", "readwrite");
    transaction.objectStore("attempts").add(attempt);
};

const getAttempts = async () => {
    const db = await openDB();
    return new Promise((resolve) => {
        const transaction = db.transaction("attempts", "readonly");
        const store = transaction.objectStore("attempts");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
};

const QuizApp = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [userAnswer, setUserAnswer] = useState("");
    const [history, setHistory] = useState([]);
    const [viewHistory, setViewHistory] = useState(false);

    useEffect(() => {
        if (timeLeft === 0) {
            nextQuestion();
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
        getAttempts().then(setHistory);
    }, []);

    const handleAnswer = async (selected) => {
        const isCorrect = selected === quizQuestions[currentIndex].answer;
        if (isCorrect) setScore(prev => prev + 1);

        const attempt = { 
            question: quizQuestions[currentIndex].question, 
            selected, 
            correct: quizQuestions[currentIndex].answer 
        };

        setAttempts(prevAttempts => [...prevAttempts, attempt]);

        await saveAttempt(attempt);
        getAttempts().then(setHistory); // Fetch history again to update

        nextQuestion();
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < quizQuestions.length) {
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(30);
            setUserAnswer("");
        } else {
            alert(`Quiz Over! Your Score: ${score}/${quizQuestions.length}`);
            restartQuiz();
        }
    };

    const restartQuiz = () => {
        setCurrentIndex(0);
        setScore(0);
        setAttempts([]);
        setTimeLeft(30);
        setUserAnswer("");
    };

    return (
        <div className="quiz-container">
            <h1>Quiz Platform</h1>
            {viewHistory ? (
                <div>
                    <h2>Attempt History</h2>
                    {history.length === 0 ? (
                        <p>No previous attempts recorded.</p>
                    ) : (
                        <ul>
                            {history.map((attempt, index) => (
                                <li key={index}>
                                    <strong>{attempt.question}</strong> - Your Answer: {attempt.selected} (Correct: {attempt.correct})
                                </li>
                            ))}
                        </ul>
                    )}
                    <button onClick={() => setViewHistory(false)}>Back to Quiz</button>
                </div>
            ) : (
                <div>
                    <div className="timer">Time Left: {timeLeft} sec</div>
                    <h2>{quizQuestions[currentIndex].question}</h2>
                    {quizQuestions[currentIndex].type === "integer" ? (
                        <div>
                            <input 
                                type="number" 
                                value={userAnswer} 
                                onChange={(e) => setUserAnswer(e.target.value)} 
                            />
                            <button onClick={() => handleAnswer(parseInt(userAnswer))}>Submit</button>
                        </div>
                    ) : (
                        quizQuestions[currentIndex].options.map(option => (
                            <button key={option} onClick={() => handleAnswer(option.charAt(0))}>
                                {option}
                            </button>
                        ))
                    )}
                    <button onClick={() => setViewHistory(true)}>View History</button>
                </div>
            )}
        </div>
    );
};

export default QuizApp;
