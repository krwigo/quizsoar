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

function App({ course, session, setSession }) {
	const [open, setOpen] = useState(true);
	const [index, setIndex] = useState(0);
	const [selection, setSelection] = useState({});
	const [alert, setAlert] = useState(null);
	const itemEls = useRef(new Array());

	let ptr = session?.shuffle?.[index];

	function answerCheck() {
		let results =
			ptr?.c?.map((c, i) => {
				if (ptr?.a?.length > 1) {
					return (
						itemEls?.current?.[i]?.checked ==
						ptr?.a?.indexOf(itemEls?.current?.[i]?.value) >= 0
					);
				} else if (ptr?.c?.length > 1) {
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
		let result = answerCheck();
		if (result && alert?.variant == "success") {
			setOpen(false);
		} else {
			setAlert(
				result
					? { variant: "success", text: "Great!" }
					: { variant: "secondary", text: "Try again." }
			);
			let k = result ? "success" : "failure";
			if (!Array.isArray(session.metrics[k][ptr.uniq])) {
				session.metrics[k][ptr.uniq] = [];
			}
			session.metrics[k][ptr.uniq].push(Date.now());
			session.success = Object.keys(session.metrics["success"]).length;
			session.failure = Object.keys(session.metrics["failure"]).length;
			setSession((prev) => storageSet(course, Object.assign({}, session)));
		}
	}

	return (
		<>
			<Stack direction="horizontal" className="my-2">
				{alert?.variant == "success" && (
					<Button variant="success" className="me-2" onClick={answerButton}>
						Next Question
					</Button>
				)}
				<Button variant="primary" className="me-2" onClick={answerButton}>
					Check
				</Button>
				<Button
					variant="secondary"
					className="me-2"
					onClick={() => setOpen(!open)}
				>
					Skip
				</Button>
				<div className="ms-auto"></div>
				<Badge bg="success">{session?.success || 0}</Badge>
				<Badge bg="danger">{session?.failure || 0}</Badge>
				<Badge bg="secondary">{session?.shuffle?.length || 0}</Badge>
			</Stack>
			<Collapse
				in={open}
				onExited={(e) =>
					setIndex((prev) => {
						setOpen(true);
						setAlert(null);
						setSelection({});
						return (prev + 1) % session?.shuffle?.length;
					})
				}
			>
				<div key={index}>
					<div className="py-5">{ptr?.q}</div>
					<div className="d-grid gap-2">
						{ptr?.c?.map((c, i) => {
							if (ptr?.a?.length > 1) {
								return (
									<div key={i}>
										<input
											type="checkbox"
											ref={(e) => (itemEls.current[i] = e)}
											value={c}
											checked={!!selection?.[i]}
											onChange={(ev) =>
												setSelection((prev) =>
													Object.assign({}, prev, { [i]: ev.target.checked })
												)
											}
										/>{" "}
										{c}
									</div>
								);
							} else if (ptr?.c?.length > 1) {
								return (
									<div key={i}>
										<input
											type="radio"
											ref={(e) => (itemEls.current[i] = e)}
											value={c}
											checked={!!selection?.[i]}
											onChange={(ev) =>
												setSelection((prev) =>
													Object.assign({}, { [i]: ev.target.checked })
												)
											}
										/>{" "}
										{c}
									</div>
								);
							} else {
								return (
									<div key={i}>
										<input
											type="text"
											ref={(e) => (itemEls.current[i] = e)}
											value={selection?.[i] || ""}
											onChange={(ev) =>
												setSelection((prev) =>
													Object.assign({}, prev, { [i]: ev.target.value })
												)
											}
										/>{" "}
										{c}
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
								<Row>
									<Col>
										<h5 className="mt-2">Complete:</h5>
										{session.metrics?.success?.[ptr?.uniq]?.map((d, idx) => (
											<div key={idx}>{new Date(d).toLocaleString()}</div>
										))}
									</Col>
								</Row>
								<Row>
									<Col>
										<h5 className="mt-2">Incomplete:</h5>
										{session.metrics?.failure?.[ptr?.uniq]?.map((d, idx) => (
											<div key={idx}>{new Date(d).toLocaleString()}</div>
										))}
									</Col>
								</Row>
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
	const [course, setCourse] = useState("");
	const [busy, setBusy] = useState(null);
	const [session, setSession] = useState({});

	useEffect(() => {
		if (!course) return;
		setBusy(`Fetching ${course}..`);
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

	return session?.shuffle?.length ? (
		<Container>
			<App course={course} session={session} setSession={setSession} />
		</Container>
	) : (
		<Container>
			<div className="mt-2">
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
			</div>
			{busy && (
				<Alert variant="secondary" className="mt-3">
					{busy}
				</Alert>
			)}
		</Container>
	);
}

createRoot(document.querySelector("#app")).render(<Boot />);
