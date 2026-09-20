export default function Toast({ message }) {
  return (
    <div className="toastwrap">
      <div className={'toast' + (message ? ' show' : '')} role="status" aria-live="polite">
        {message}
      </div>
    </div>
  );
}
