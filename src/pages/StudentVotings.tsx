import React from "react";
import MobileHeader from "@/components/MobileHeader";
import StudentTabBar from "@/components/StudentTabBar";

const StudentVotings: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
			<MobileHeader title="Class Votings" />
			<main className="container mx-auto px-4 py-6 pb-20">
				<div className="p-6">Votings coming soon.</div>
			</main>
			<StudentTabBar />
		</div>
	);
};

export default StudentVotings;
