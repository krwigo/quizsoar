import React, { useState, useEffect, useRef } from "react";

import { createRoot } from "react-dom/client";

import {
	Container,
	Row,
	Col,
	Button,
	Badge,
	Collapse,
	Stack,
	Form,
	Alert,
} from "react-bootstrap";

import { Gear } from "react-bootstrap-icons";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	ArcElement,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";

import { Chart, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	ArcElement,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

import "bootstrap/dist/css/bootstrap.min.css";

const success_phrases = [
	"Fantastic",
	"Incredible",
	"Unbelievable",
	"Wonderful",
	"Astonishing",
	"Awesome",
	"Brilliant",
	"Extraordinary",
	"Marvelous",
	"Fabulous",
	"Phenomenal",
	"Spectacular",
	"Remarkable",
	"Sensational",
	"Great",
	"Miraculous",
	"Beautiful",
	"Magnificent",
	"Terrific",
	"Outstanding",
];

function storageGet(course) {
	let dat = Date.now();
	let ses;
	try {
		ses = JSON.parse(localStorage.getItem(`quiz_session_${course}`));
		if (!ses?.course) throw "!ses";
	} catch (err) {
		ses = {};
	}
	return Object.assign(
		{
			course: null,
			dateStart: dat,
			dateLast: dat,
			shuffle: [],
			success: 0,
			failure: 0,
			unknown: 0,
			metrics: {
				success: {},
				failure: {},
			},
		},
		ses
	);
}

function storageSet(course, ses) {
	let dat = Date.now();
	let enc = Object.assign(
		{
			course: null,
			dateStart: dat,
			dateLast: dat,
			shuffle: [],
			success: 0,
			failure: 0,
			unknown: 0,
			metrics: {
				success: {},
				failure: {},
			},
		},
		ses,
		{ dateLast: dat }
	);
	localStorage.setItem(
		`quiz_session_${course}`,
		JSON.stringify(Object.assign({}, enc, { shuffle: [] }))
	);
	return enc;
}

function randFn(a, b) {
	return a?.rand - b?.rand;
}

function uniqSt(a) {
	return `${a.replaceAll(/[^a-z0-9]+/gi, "_").substring(0, 12)}${Array.from(a)
		.map((a, i, o) => a.charCodeAt(0))
		.reduce((o, a) => o + a, 0)}`;
}

function emitGA(i) {
	try {
		window.gtag(
			"event",
			"quiz",
			Object.assign(
				//
				{},
				i,
				{
					user_properties: Object.assign(
						//
						{},
						i
					),
				}
			)
		);
	} catch (err) {}
}

function App({ course, setCourse, session, setSession }) {
	const [open, setOpen] = useState(true);
	const [index, setIndex] = useState(0);
	const [selection, setSelection] = useState({});
	const [alert, setAlert] = useState(null);
	const [reveal, setReveal] = useState(false);
	const itemEls = useRef(new Array());

	let ptr = session?.shuffle?.[index];

	let isChk = ptr?.a?.length > 1;
	let isRad = !isChk && ptr?.c?.length > 1;
	// let isTxt = !isChk && !isRad;
	// console.log(ptr, { isChk, isRad, isTxt });
	// if (!isTxt) setTimeout(() => setIndex(prev => (prev + 1) % session?.shuffle?.length));

	function answerCheck() {
		let results =
			ptr?.c?.map((c, i) => {
				if (isChk) {
					return (
						itemEls?.current?.[i]?.checked ==
						ptr?.a?.indexOf(itemEls?.current?.[i]?.value) >= 0
					);
				} else if (isRad) {
					return (
						itemEls?.current?.[i]?.checked ==
						ptr?.a?.indexOf(itemEls?.current?.[i]?.value) >= 0
					);
				} else {
					return (
						ptr?.a
							?.map((n) => n.toLowerCase())
							.indexOf(itemEls?.current?.[i]?.value?.toLowerCase()) >= 0
					);
				}
			}) || [];
		return !!results?.length && results.reduce((out, cur) => out && cur, true);
	}

	function answerButton() {
		if (reveal || alert?.variant == "success") {
			setOpen(false);
			return;
		}
		if (!Object.keys(selection).length) {
			return;
		}
		let result = answerCheck();
		let message = result
			? {
					//
					variant: "success",
					text: `${
						success_phrases[(success_phrases.length * Math.random()) | 0]
					}!`,
			  }
			: {
					//
					variant: "secondary",
					text: "Try again.",
			  };
		setAlert(message);
		let k = result ? "success" : "failure";
		if (!Array.isArray(session.metrics[k][ptr.uniq])) {
			session.metrics[k][ptr.uniq] = [];
		}
		session.metrics[k][ptr.uniq].push(Date.now());
		session.success = Object.keys(session.metrics["success"]).length;
		session.failure = Object.keys(session.metrics["failure"]).length;
		setSession((prev) => storageSet(course, Object.assign({}, session)));
		emitGA({
			//
			course: course,
			card_question: ptr?.q,
			message_text: message?.text,
		});
	}

	return (
		<>
			<Stack direction="horizontal" className="my-2">
				<Button
					variant={alert?.variant == "success" ? "success" : "primary"}
					className="me-2"
					onClick={answerButton}
				>
					{reveal || alert?.variant == "success" ? "Next" : "Check"}
				</Button>
				<Button
					variant="secondary"
					className="me-2"
					onClick={() => setOpen(!open)}
				>
					Skip
				</Button>
				<Button
					variant="secondary"
					disabled={reveal || alert?.variant == "success"}
					onClick={() => setReveal(true)}
				>
					Reveal
				</Button>
				<div className="ms-auto"></div>
				<Badge bg="success">{session?.success || 0}</Badge>
				<Badge bg="danger">{session?.failure || 0}</Badge>
				<Badge bg="secondary">{session?.shuffle?.length || 0}</Badge>
				<Button
					variant="link"
					className="d-flex p-1"
					onClick={() => setCourse("")}
				>
					<Gear />
				</Button>
			</Stack>
			<Collapse
				in={open}
				onExited={(e) =>
					setIndex((prev) => {
						setOpen(true);
						setAlert(null);
						setReveal(false);
						setSelection({});
						return (prev + 1) % session?.shuffle?.length;
					})
				}
			>
				<div key={index}>
					<div className="py-5">{ptr?.q}</div>
					<div className="d-grid gap-2">
						{ptr?.c?.map((c, i) => {
							if (isChk) {
								return (
									<div key={i}>
										<input
											type="checkbox"
											id={`input${i}`}
											ref={(e) => (itemEls.current[i] = e)}
											value={c}
											checked={!!selection?.[i]}
											disabled={reveal}
											onChange={(ev) =>
												setSelection((prev) =>
													Object.assign({}, prev, { [i]: ev.target.checked })
												)
											}
										/>{" "}
										<label
											for={`input${i}`}
											className={
												reveal && ptr?.a?.indexOf(c) >= 0
													? "alert alert-primary p-0 m-0"
													: ""
											}
										>
											{c}
										</label>
									</div>
								);
							} else if (isRad) {
								return (
									<div key={i}>
										<input
											type="radio"
											id={`input${i}`}
											ref={(e) => (itemEls.current[i] = e)}
											value={c}
											checked={!!selection?.[i]}
											disabled={reveal}
											onChange={(ev) =>
												setSelection((prev) =>
													Object.assign({}, { [i]: ev.target.checked })
												)
											}
										/>{" "}
										<label
											for={`input${i}`}
											className={
												reveal && ptr?.a?.indexOf(c) >= 0
													? "alert alert-primary p-0 m-0"
													: ""
											}
										>
											{c}
										</label>
									</div>
								);
							} else {
								return (
									<div key={i}>
										<input
											type="text"
											id={`input${i}`}
											ref={(e) => (itemEls.current[i] = e)}
											value={selection?.[i] || ""}
											disabled={reveal}
											onChange={(ev) =>
												setSelection((prev) =>
													Object.assign({}, prev, { [i]: ev.target.value })
												)
											}
										/>{" "}
										{reveal && (
											<>
												<span className={"alert alert-primary p-0 m-0"}>
													{reveal && ptr?.a?.[0]}
												</span>{" "}
											</>
										)}
										<label for={`input${i}`}>{c}</label>
									</div>
								);
							}
						})}
					</div>
					{alert && (
						<Alert className="mt-3" variant={alert?.variant || "secondary"}>
							{alert?.text}
						</Alert>
					)}

					{alert && (
						<div className="mt-5" style={{ height: "150px" }}>
							<Doughnut
								options={{ responsive: true, maintainAspectRatio: false }}
								data={{
									labels: ["Complete", "Incomplete"],
									datasets: [
										{
											data: [
												Object.keys(session.metrics?.success?.[ptr?.uniq] || [])
													?.length || 0,
												Object.keys(session.metrics?.failure?.[ptr?.uniq] || [])
													?.length || 0,
											],

											backgroundColor: [
												"rgba(75, 192, 192, 0.2)",
												"rgba(255, 99, 132, 0.2)",
											],
											borderColor: [
												"rgba(75, 192, 192, 1)",
												"rgba(255, 99, 132, 1)",
											],
											borderWidth: 1,
										},
									],
								}}
							/>

							<Container className="mt-3">
								{session.metrics?.success?.[ptr?.uniq]?.length && (
									<Row>
										<Col>
											<h5 className="mt-2">Complete:</h5>
											{session.metrics?.success?.[ptr?.uniq]
												?.map((d) => new Date(d).toLocaleDateString())
												.filter((d, idx, a) => idx == a.indexOf(d))
												.map((d, idx) => (
													<div key={idx}>{d}</div>
												))}
										</Col>
									</Row>
								)}
								{session.metrics?.failure?.[ptr?.uniq]?.length && (
									<Row>
										<Col>
											<h5 className="mt-2">Incomplete:</h5>
											{session.metrics?.failure?.[ptr?.uniq]
												?.map((d) => new Date(d).toLocaleDateString())
												.filter((d, idx, a) => idx == a.indexOf(d))
												.map((d, idx) => (
													<div key={idx}>{d}</div>
												))}
										</Col>
									</Row>
								)}
							</Container>
						</div>
					)}
				</div>
			</Collapse>
		</>
	);
}

const courses = ["c191", "c857"];

function Boot() {
	const [course, setCourse] = useState(
		() => localStorage.getItem("quiz_course") || ""
	);
	const [busy, setBusy] = useState(null);
	const [session, setSession] = useState({});

	useEffect(() => {
		if (!course) return;
		setBusy(`Fetching ${course}..`);
		localStorage.setItem("quiz_course", course);
		fetch(`${course}.json`)
			.then((e) => e.json())
			.then((e) =>
				setSession((prev) =>
					Object.assign({}, storageGet(course), {
						shuffle: e
							.map((c) =>
								Object.assign(c, {
									rand: Math.random() * 1000,
									uniq: uniqSt(c?.q),
								})
							)
							.sort(randFn),
						course,
					})
				)
			)
			.catch((e) => {
				setBusy(`${e}`);
				setCourse("");
			});
	}, [course]);

	return course && session?.shuffle?.length ? (
		<Container>
			<App
				course={course}
				setCourse={setCourse}
				session={session}
				setSession={setSession}
			/>
		</Container>
	) : (
		<Container>
			<Stack direction="horizontal" className="my-2">
				<h1>QuizSoar</h1>
				<a
					className="ms-auto"
					target="_blank"
					href="https://github.com/krwigo/quizsoar"
				>
					view source
				</a>
			</Stack>
			<h4>Course Selection:</h4>
			{courses.map((c, idx) => (
				<Button
					key={idx}
					className="me-2"
					onClick={() => {
						setCourse(c);
						setBusy(null);
					}}
				>
					{c}
				</Button>
			))}
			{course && busy && (
				<Alert variant="secondary" className="mt-3">
					{busy}
				</Alert>
			)}
		</Container>
	);
}

createRoot(document.querySelector("#app")).render(<Boot />);
