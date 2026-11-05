/** Submitted snapshot only. Correct answers are never part of the live question UI. */
export function AssessmentReview({ feedback, score, collapsed = false }) {
    if (!feedback?.length)
        return null;
    return (<section className="my-8 rounded-2xl border bg-card p-5 md:p-8" aria-label="Assessment feedback" data-testid="assessment-review">
      <details open={!collapsed} data-testid="assessment-review-disclosure">
        <summary className="cursor-pointer rounded-md text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <h2 className="inline font-serif text-xl md:text-2xl font-bold">Latest submitted assessment review</h2>
        </summary>
        <div className="mt-5 space-y-4">
        <p className="text-sm text-muted-foreground mt-2">
          {score != null && `Score: ${score}%. `}Review the explanations and revisit the associated lessons before a retake.
        </p>
      <ol className="space-y-3">
        {feedback.map((item, index) => (<li key={item.questionId}>
            <details className="rounded-xl border p-4 break-words" data-testid={`feedback-${item.questionId}`}>
              <summary className="cursor-pointer font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                {index + 1}. {item.isCorrect ? "Correct" : "Incorrect"} - {item.prompt}
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-relaxed">
                <p className="text-muted-foreground">{item.topic}</p>
                <p><strong>Your answer:</strong> {item.selectedAnswer}</p>
                <p><strong>Correct answer:</strong> {item.correctAnswer}</p>
                <p><strong>Explanation:</strong> {item.explanation}</p>
              </div>
            </details>
          </li>))}
      </ol>
        </div>
      </details>
    </section>);
}
