import React from "react";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";

const StudentFeedback: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
			<MobileHeader title="Feedback" />
			<main className="container mx-auto px-4 py-6 pb-20">
				<div className="p-6">Feedback coming soon.</div>
			</main>
			<StudentTabBar />
		</div>
	);
};

export default StudentFeedback;
