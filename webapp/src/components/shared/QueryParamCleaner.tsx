"use client"

import { useEffect } from "react"

interface QueryParamCleanerProps {
	/**
	 * Milliseconds to wait before removing query params
	 */
	delayMs?: number
	/**
	 * Keys to strip when value is benign (success/true/ok/empty)
	 */
	keys?: string[]
}

/**
 * Removes benign, temporary query params (e.g., credits=success) after a short delay
 * without reloading the page. Uses history.replaceState to preserve navigation stack.
 */
export function QueryParamCleaner({ delayMs = 3000, keys = ["credits", "subscription", "upgrade"] }: QueryParamCleanerProps) {
	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			try {
				const benignValues = new Set(["success", "true", "false", "ok", ""]) // values considered safe to auto-remove
				const url = new URL(window.location.href)
				const params = new URLSearchParams(url.search)
				let changed = false

				for (const key of keys) {
					if (!params.has(key)) continue
					const value = params.get(key) ?? ""
					if (benignValues.has(value.toLowerCase())) {
						params.delete(key)
						changed = true
					}
				}

				if (changed) {
					const newSearch = params.toString()
					const newUrl = `${url.pathname}${newSearch ? `?${newSearch}` : ""}${url.hash}`
					window.history.replaceState(null, "", newUrl)
				}
			} catch (_) {
				// noop: best-effort cleanup only
			}
		}, delayMs)

		return () => window.clearTimeout(timeoutId)
	}, [delayMs, keys])

	return null
}

export default QueryParamCleaner


